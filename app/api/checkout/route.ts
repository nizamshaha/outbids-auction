import { NextRequest, NextResponse } from 'next/server';
import { CreateCheckoutPayload, CheckoutResponse } from '@/types/bid';
import { createAdminClient } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';
import { scrapeUrlMetadata } from '@/utils/metadata';

export const dynamic = 'force-dynamic';

function getDodoBaseUrl(): string {
  const env = process.env.DODO_PAYMENTS_ENVIRONMENT || 'live_mode';
  return env === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateCheckoutPayload = await req.json();
    const { url, amountInDollars, category = 'Other', title, description, isFreeTier = false } = body;

    // 1. Validate URL or @handle
    if (!url || typeof url !== 'string') {
      return NextResponse.json<CheckoutResponse>(
        { error: 'A valid website URL or @handle is required.' },
        { status: 400 }
      );
    }

    const { isValid, normalizedUrl, displayDomain, error: urlError } = sanitizeAndNormalizeUrl(url);
    if (!isValid) {
      return NextResponse.json<CheckoutResponse>(
        { error: urlError || 'Invalid URL or @handle.' },
        { status: 400 }
      );
    }

    // 2. Scrape metadata if title / description were not provided
    const scraped = await scrapeUrlMetadata(normalizedUrl);
    const finalTitle = title?.trim() || scraped.title || displayDomain;
    const finalDescription = description?.trim() || scraped.description || null;
    const finalIconUrl = scraped.iconUrl || null;

    const supabase = createAdminClient();

    // 3. Check for existing listing (Top-Up logic)
    const { data: existingBid } = await supabase
      .from('bids')
      .select('id, amount, status')
      .eq('url', normalizedUrl)
      .limit(1)
      .maybeSingle();

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

      // Direct insertion without payment gateway
      const { data: inserted, error: insertError } = await supabase
        .from('bids')
        .insert({
          url: normalizedUrl,
          amount: 0,
          status: 'paid',
          category,
          title: finalTitle,
          description: finalDescription,
          icon_url: finalIconUrl,
          click_count: 0,
          view_count: 0,
        })
        .select()
        .single();

      if (insertError) {
        // Fallback for core schema
        const fallback = await supabase
          .from('bids')
          .insert({
            url: normalizedUrl,
            amount: 0,
            status: 'paid',
            title: finalTitle,
            description: finalDescription,
          })
          .select()
          .single();

        if (fallback.error) throw fallback.error;

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
    const targetAmountCents = Math.round(Number(amountInDollars) * 100);

    if (isNaN(targetAmountCents) || targetAmountCents < 100) {
      return NextResponse.json<CheckoutResponse>(
        { error: 'Minimum bid amount is $1.00.' },
        { status: 400 }
      );
    }

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
    const apiKey = process.env.DODO_PAYMENTS_API_KEY;
    const productId = process.env.DODO_PAYMENTS_PRODUCT_ID || 'pdt_0Nm9Jk0QoBKXJmjXqt2u2';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://outbids.auction';

    if (!apiKey) {
      console.error('[Dodo Payments] DODO_PAYMENTS_API_KEY is not configured in environment.');
      return NextResponse.json<CheckoutResponse>(
        { error: 'Payment gateway configuration missing. Please contact support.' },
        { status: 500 }
      );
    }

    const dodoBaseUrl = getDodoBaseUrl();

    // Prepare Dodo Payments Checkout Session Payload
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
      return_url: `${siteUrl}/?success=true`,
      metadata: {
        url: normalizedUrl,
        category: category || 'Other',
        bid_amount: targetAmountCents.toString(),
        is_topup: isTopUp ? 'true' : 'false',
        existing_bid_id: existingBid?.id || '',
        title: finalTitle || '',
        description: finalDescription || '',
        icon_url: finalIconUrl || '',
      },
    };

    console.log(`[Dodo Payments] Initiating checkout for ${normalizedUrl} (${isTopUp ? 'Top-Up' : 'New'}, charge: $${chargeAmountCents / 100})`);

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
    console.error('[Checkout Route Error]:', error);
    return NextResponse.json<CheckoutResponse>(
      { error: error?.message || 'An unexpected error occurred during checkout initialization.' },
      { status: 500 }
    );
  }
}
