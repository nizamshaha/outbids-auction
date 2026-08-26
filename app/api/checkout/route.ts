import { NextRequest, NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { createAdminClient, supabaseAdmin } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';
import { createPayPalOrder } from '@/utils/paypal';
import { scrapeUrlMetadata } from '@/utils/metadata';

const MINIMUM_PAID_BID_CENTS = 500; // Minimum $5.00 for paid bids

async function insertBidSafely(dbClient: any, payload: {
  url: string;
  amount: number;
  status: string;
  category: string;
  title: string | null;
  description: string | null;
  icon_url: string | null;
}) {
  // First attempt: insert with all rich schema columns
  const firstAttempt = await dbClient
    .from('bids')
    .insert({
      url: payload.url,
      amount: payload.amount,
      status: payload.status,
      category: payload.category,
      title: payload.title,
      description: payload.description,
      icon_url: payload.icon_url,
      click_count: 0,
      view_count: 0,
    })
    .select('id')
    .single();

  if (!firstAttempt.error && firstAttempt.data) {
    return { data: firstAttempt.data, error: null };
  }

  // Fallback: If category or rich columns are not in schema cache, insert core columns
  console.warn('[Supabase Insert Fallback] Retrying with core schema columns:', firstAttempt.error?.message);
  const fallbackAttempt = await dbClient
    .from('bids')
    .insert({
      url: payload.url,
      amount: payload.amount,
      status: payload.status,
      title: payload.title,
      description: payload.description,
    })
    .select('id')
    .single();

  return fallbackAttempt;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, amount, amountInDollars, category, title, description, isFreeTier } = body;

    // Validate and sanitize URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Website URL is required.' },
        { status: 400 }
      );
    }

    const urlCheck = sanitizeAndNormalizeUrl(url);
    if (!urlCheck.isValid) {
      return NextResponse.json(
        { error: urlCheck.error || 'Invalid URL provided.' },
        { status: 400 }
      );
    }

    const normalizedUrl = urlCheck.normalizedUrl;
    const displayDomain = urlCheck.displayDomain;
    const selectedCategory = category || 'Other';

    // Normalize amount to cents
    let amountCents: number = 0;
    if (typeof amount === 'number') {
      amountCents = amount >= 100 && Number.isInteger(amount) ? amount : Math.round(amount * 100);
    } else if (typeof amountInDollars === 'number') {
      amountCents = Math.round(amountInDollars * 100);
    }

    const dbClient = createAdminClient ? createAdminClient() : supabaseAdmin;

    // Scrape Rich Metadata (Title, Description, Favicon)
    const scraped = await scrapeUrlMetadata(normalizedUrl);
    const finalTitle = title || scraped.title || displayDomain;
    const finalDescription = description || scraped.description;
    const finalIconUrl = scraped.iconUrl;

    // -------------------------------------------------------------
    // 1. FREE TIER LOGIC ($0 Bids)
    // -------------------------------------------------------------
    if (isFreeTier || amountCents === 0) {
      console.log(`[Checkout] Processing Free Tier entry for: ${normalizedUrl}`);

      // Check if URL already exists
      const { data: existingFree } = await dbClient
        .from('bids')
        .select('id, amount')
        .eq('url', normalizedUrl)
        .eq('status', 'paid')
        .limit(1)
        .maybeSingle();

      if (existingFree) {
        return NextResponse.json(
          { error: 'This URL is already listed on the leaderboard! Use Outbid to top-up and boost its rank.' },
          { status: 400 }
        );
      }

      const { data: freeBid, error: freeError } = await insertBidSafely(dbClient, {
        url: normalizedUrl,
        amount: 0,
        status: 'paid',
        category: selectedCategory,
        title: finalTitle,
        description: finalDescription,
        icon_url: finalIconUrl,
      });

      if (freeError || !freeBid) {
        console.error('Error inserting free bid into Supabase:', freeError);
        return NextResponse.json(
          { error: `Database error creating free listing: ${freeError?.message}` },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        provider: 'free',
        bidId: freeBid.id,
        message: '🎉 Free listing created and broadcasted to the leaderboard!',
      });
    }

    // -------------------------------------------------------------
    // 2. PAID BID VALIDATION & TOP-UP DETECTION
    // -------------------------------------------------------------
    if (amountCents < MINIMUM_PAID_BID_CENTS) {
      return NextResponse.json(
        { error: `Minimum paid bid is $5.00 ($${MINIMUM_PAID_BID_CENTS / 100} USD).` },
        { status: 400 }
      );
    }

    // Check for existing paid bid to apply Top-Up calculation
    const { data: existingPaidBid } = await dbClient
      .from('bids')
      .select('id, amount, url')
      .eq('url', normalizedUrl)
      .eq('status', 'paid')
      .limit(1)
      .maybeSingle();

    let chargeAmountCents = amountCents;
    let isTopUp = false;
    let existingBidId: string | null = null;

    if (existingPaidBid) {
      const currentPaid = existingPaidBid.amount;

      if (amountCents <= currentPaid) {
        return NextResponse.json(
          {
            error: `Your URL is currently placed at $${(currentPaid / 100).toFixed(2)}. To top-up and outbid, enter an amount higher than $${(currentPaid / 100).toFixed(2)}.`,
          },
          { status: 400 }
        );
      }

      // Charge only the incremental difference
      chargeAmountCents = amountCents - currentPaid;
      isTopUp = true;
      existingBidId = existingPaidBid.id;
      console.log(`[Top-Up Detected] Upgrading ${normalizedUrl} from $${currentPaid / 100} to $${amountCents / 100}. Charging difference: $${chargeAmountCents / 100}`);
    }

    // Insert pending bid record safely
    const { data: newBid, error: dbError } = await insertBidSafely(dbClient, {
      url: normalizedUrl,
      amount: amountCents, // Total target rank amount
      status: 'pending',
      category: selectedCategory,
      title: finalTitle,
      description: finalDescription,
      icon_url: finalIconUrl,
    });

    if (dbError || !newBid) {
      console.error('Error inserting pending bid into Supabase:', dbError);
      return NextResponse.json(
        {
          error: `Database error creating pending bid: ${dbError?.message || 'Failed to insert pending bid'}`,
        },
        { status: 500 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      req.nextUrl.origin ||
      'https://outbids.auction';

    // -------------------------------------------------------------
    // 3. PAYPAL CHECKOUT INITIALIZATION
    // -------------------------------------------------------------
    const paypalClientId =
      process.env.PAYPAL_CLIENT_ID ||
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      '';
    const paypalSecret = process.env.PAYPAL_SECRET || '';

    if (paypalClientId && paypalSecret) {
      try {
        console.log(`[Checkout] Creating PayPal order for bid ${newBid.id} (Charging: $${chargeAmountCents / 100})`);
        
        // Pass top-up query params to capture handler
        const captureUrl = isTopUp
          ? `${siteUrl}/api/paypal/capture?bid_id=${newBid.id}&top_up_target=${existingBidId}&new_amount=${amountCents}`
          : `${siteUrl}/api/paypal/capture?bid_id=${newBid.id}`;

        const paypalOrder = await createPayPalOrder({
          amountInDollars: chargeAmountCents / 100,
          bidId: newBid.id,
          returnUrl: captureUrl,
          cancelUrl: `${siteUrl}/?canceled=true`,
        });

        return NextResponse.json({
          url: paypalOrder.approvalUrl,
          orderId: paypalOrder.orderId,
          bidId: newBid.id,
          provider: 'paypal',
          isTopUp,
          amountChargedDollars: chargeAmountCents / 100,
          totalBidDollars: amountCents / 100,
        });
      } catch (paypalError: any) {
        console.error('[Checkout] PayPal order creation error:', paypalError);
      }
    }

    // -------------------------------------------------------------
    // 4. DODO PAYMENTS FALLBACK (IF CONFIGURED)
    // -------------------------------------------------------------
    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY || '';
    const dodoEnvironment =
      (process.env.DODO_PAYMENTS_ENVIRONMENT as 'live_mode' | 'test_mode') || 'test_mode';
    const dodoProductId = process.env.DODO_PAYMENTS_PRODUCT_ID || '';

    if (dodoApiKey && dodoProductId) {
      const dodo = new DodoPayments({
        bearerToken: dodoApiKey,
        environment: dodoEnvironment,
      });

      const payment = await dodo.payments.create({
        payment_link: true,
        billing: { country: 'US' },
        customer: {
          email: `bidder_${newBid.id.slice(0, 8)}@outbids.auction`,
          name: `Bidder for ${displayDomain}`,
        },
        return_url: `${siteUrl}/?success=true&bid_id=${newBid.id}`,
        metadata: {
          bid_id: newBid.id,
          bid_url: normalizedUrl,
          is_top_up: isTopUp ? 'true' : 'false',
        },
        product_cart: [
          {
            product_id: dodoProductId,
            amount: chargeAmountCents,
            quantity: 1,
          },
        ],
      });

      const checkoutUrl =
        payment.payment_link ||
        (payment as any).payment_link_url ||
        (payment as any).url;

      if (checkoutUrl) {
        return NextResponse.json({
          url: checkoutUrl,
          bidId: newBid.id,
          provider: 'dodopayments',
          isTopUp,
          amountChargedDollars: chargeAmountCents / 100,
        });
      }
    }

    return NextResponse.json(
      { error: 'No active payment gateway configured. Please check PayPal credentials.' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Checkout API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'An internal server error occurred during checkout initialization.' },
      { status: 500 }
    );
  }
}
