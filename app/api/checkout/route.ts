import { NextRequest, NextResponse } from 'next/server';
import { CreateCheckoutPayload, CheckoutResponse } from '@/types/bid';
import { createAdminClient } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';
import { scrapeUrlMetadata, isSafePublicUrl } from '@/utils/metadata';

export const dynamic = 'force-dynamic';

const MAX_BID_AMOUNT_DOLLARS = 1000000; // $1,000,000 max single bid limit to prevent numeric overflow
const MIN_BID_AMOUNT_DOLLARS = 1;       // $1.00 minimum bid

function getDodoBaseUrl(): string {
  const env = process.env.DODO_PAYMENTS_ENVIRONMENT || 'live_mode';
  return env === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';
}

export async function POST(req: NextRequest) {
  try {
    let body: CreateCheckoutPayload;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json<CheckoutResponse>(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { url, amountInDollars, category = 'Other', title, description, isFreeTier = false } = body;

    // 1. Strict URL validation and normalization
    if (!url || typeof url !== 'string') {
      return NextResponse.json<CheckoutResponse>(
        { error: 'A valid website URL or @handle is required.' },
        { status: 400 }
      );
    }

    const { isValid, normalizedUrl, displayDomain, error: urlError } = sanitizeAndNormalizeUrl(url);
    if (!isValid || !normalizedUrl) {
      return NextResponse.json<CheckoutResponse>(
        { error: urlError || 'Invalid URL or @handle format.' },
        { status: 400 }
      );
    }

    // SSRF validation on normalized URL
    if (!isSafePublicUrl(normalizedUrl)) {
      return NextResponse.json<CheckoutResponse>(
        { error: 'Submitted URL cannot point to internal or restricted IP addresses.' },
        { status: 400 }
      );
    }

    // Sanitize category, title, and description inputs
    const sanitizedCategory = typeof category === 'string' ? category.trim().slice(0, 50) : 'Other';
    const sanitizedTitleInput = typeof title === 'string' ? title.trim().slice(0, 100) : '';
    const sanitizedDescInput = typeof description === 'string' ? description.trim().slice(0, 300) : '';

    // 2. Scrape metadata safely with SSRF protection & timeouts
    const scraped = await scrapeUrlMetadata(normalizedUrl);
    const finalTitle = sanitizedTitleInput || scraped.title || displayDomain;
    const finalDescription = sanitizedDescInput || scraped.description || null;
    const finalIconUrl = scraped.iconUrl || null;

    const supabase = createAdminClient();

    // 3. Query existing listing for top-up calculation
    const { data: existingBid, error: queryError } = await supabase
      .from('bids')
      .select('id, amount, status')
      .eq('url', normalizedUrl)
      .limit(1)
      .maybeSingle();

    if (queryError) {
      console.error('[Checkout Database Error]:', queryError);
      return NextResponse.json<CheckoutResponse>(
        { error: 'Database service unavailable. Please try again.' },
        { status: 500 }
      );
    }

    const existingAmountCents = existingBid ? existingBid.amount : 0;
    const isFreeSubmission = isFreeTier || Number(amountInDollars) === 0;

    // -------------------------------------------------------------
    // A. FREEMIUM / FREE TIER ($0) SUBMISSION
    // -------------------------------------------------------------
    if (isFreeSubmission) {
      if (existingBid) {
        return NextResponse.json<CheckoutResponse>(
          { error: `${displayDomain} is already listed on the leaderboard! Enter a bid amount to upgrade its rank.` },
          { status: 400 }
        );
      }

      // Direct insertion with parameterized DTO
      const { data: inserted, error: insertError } = await supabase
        .from('bids')
        .insert({
          url: normalizedUrl,
          amount: 0,
          status: 'paid',
          category: sanitizedCategory,
          title: finalTitle,
          description: finalDescription,
          icon_url: finalIconUrl,
          click_count: 0,
          view_count: 0,
        })
        .select('id')
        .single();

      if (insertError) {
        // Fallback for minimal core schema
        const fallback = await supabase
          .from('bids')
          .insert({
            url: normalizedUrl,
            amount: 0,
            status: 'paid',
            title: finalTitle,
            description: finalDescription,
          })
          .select('id')
          .single();

        if (fallback.error) {
          console.error('[Free Tier Insert Error]:', fallback.error);
          throw fallback.error;
        }

        return NextResponse.json<CheckoutResponse>({
          provider: 'free',
          bidId: fallback.data.id,
          totalBidDollars: 0,
          amountChargedDollars: 0,
          message: `🎉 Free Tier listing for ${displayDomain} is now live!`,
        });
      }

      return NextResponse.json<CheckoutResponse>({
        provider: 'free',
        bidId: inserted.id,
        totalBidDollars: 0,
        amountChargedDollars: 0,
        message: `🎉 Free Tier listing for ${displayDomain} is now live!`,
      });
    }

    // -------------------------------------------------------------
    // B. PAID BIDDING & TOP-UP DIFFERENCE CALCULATION
    // -------------------------------------------------------------
    const rawNumAmount = Number(amountInDollars);

    if (isNaN(rawNumAmount) || !isFinite(rawNumAmount) || rawNumAmount < MIN_BID_AMOUNT_DOLLARS) {
      return NextResponse.json<CheckoutResponse>(
        { error: `Minimum bid amount is $${MIN_BID_AMOUNT_DOLLARS.toFixed(2)}.` },
        { status: 400 }
      );
    }

    if (rawNumAmount > MAX_BID_AMOUNT_DOLLARS) {
      return NextResponse.json<CheckoutResponse>(
        { error: `Maximum allowable single bid is $${MAX_BID_AMOUNT_DOLLARS.toLocaleString()}.` },
        { status: 400 }
      );
    }

    const targetAmountCents = Math.round(rawNumAmount * 100);
    let chargeAmountCents = targetAmountCents;
    let isTopUp = false;

    if (existingBid) {
      if (targetAmountCents <= existingAmountCents) {
        return NextResponse.json<CheckoutResponse>(
          {
            error: `Your website is already listed at $${(existingAmountCents / 100).toFixed(
              2
            )}. Enter an amount higher than $${(existingAmountCents / 100).toFixed(
              2
            )} to outbid and climb the leaderboard!`,
          },
          { status: 400 }
        );
      }

      // Charge only the delta difference
      chargeAmountCents = targetAmountCents - existingAmountCents;
      isTopUp = true;
    }

    // -------------------------------------------------------------
    // C. DODO PAYMENTS API INTEGRATION
    // -------------------------------------------------------------
    const apiKey = process.env.DODO_SECRET_KEY || process.env.DODO_PAYMENTS_API_KEY;
    const productId = process.env.DODO_PAYMENTS_PRODUCT_ID || 'pdt_0Nm9Jk0QoBKXJmjXqt2u2';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://outbids.auction';

    if (!apiKey) {
      console.error('[Dodo Payments Security] DODO_SECRET_KEY or DODO_PAYMENTS_API_KEY is not configured.');
      return NextResponse.json<CheckoutResponse>(
        { error: 'Payment gateway configuration missing. Please contact support.' },
        { status: 500 }
      );
    }

    const dodoBaseUrl = getDodoBaseUrl();

    // Prepare strictly sanitized Dodo Payments Checkout Payload
    const dodoPayload = {
      billing: {
        country: 'US',
      },
      customer: {
        email: 'customer@outbids.auction',
        name: 'Outbids Supporter',
      },
      payment_link: true,
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
          amount: chargeAmountCents,
        },
      ],
      return_url: `${siteUrl}/`,
      metadata: {
        url: normalizedUrl,
        category: sanitizedCategory,
        bid_amount: targetAmountCents.toString(),
        is_topup: isTopUp ? 'true' : 'false',
        existing_bid_id: existingBid?.id || '',
        title: finalTitle || '',
        description: finalDescription || '',
        icon_url: finalIconUrl || '',
      },
    };

    console.log(`[Dodo Payments] Initiating secure checkout for ${normalizedUrl} (${isTopUp ? 'Top-Up' : 'New'}, charge: $${chargeAmountCents / 100})`);

    const dodoRes = await fetch(`${dodoBaseUrl}/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dodoPayload),
    });

    const dodoData = await dodoRes.json();

    if (!dodoRes.ok || (!dodoData.payment_link && !dodoData.url)) {
      console.error('[Dodo Payments API Error]:', dodoData);
      throw new Error(dodoData.message || dodoData.error || 'Failed to generate Dodo Payments checkout session.');
    }

    const checkoutUrl = dodoData.payment_link || dodoData.url;

    return NextResponse.json<CheckoutResponse>({
      url: checkoutUrl,
      orderId: dodoData.payment_id,
      provider: 'dodopayments',
      isTopUp,
      amountChargedDollars: chargeAmountCents / 100,
      totalBidDollars: targetAmountCents / 100,
    });
  } catch (error: any) {
    console.error('[Checkout Route Security Error]:', error);
    return NextResponse.json<CheckoutResponse>(
      { error: error?.message || 'An unexpected error occurred during checkout initialization.' },
      { status: 500 }
    );
  }
}
