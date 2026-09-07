import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { isSafePublicUrl } from '@/utils/metadata';
import { getClientIp, sanitizeString, validateRequestOrigin } from '@/utils/securityUtils';
import { checkRateLimit } from '@/utils/rateLimit';

export const dynamic = 'force-dynamic';

function getDodoBaseUrl(): string {
  const env = process.env.DODO_PAYMENTS_ENVIRONMENT || 'live_mode';
  return env === 'live_mode'
    ? 'https://live.dodopayments.com'
    : 'https://test.dodopayments.com';
}

const PAYMENT_ID_REGEX = /^pay_[A-Za-z0-9_-]{8,100}$/;

export async function GET(req: NextRequest) {
  // 1. Cross-Origin Validation
  if (!validateRequestOrigin(req)) {
    return NextResponse.json(
      { error: 'Cross-origin request forbidden.' },
      { status: 403 }
    );
  }

  const clientIp = getClientIp(req);

  // 2. Rate Limiting Protection (30 requests per minute per IP)
  const rateLimit = checkRateLimit('checkout_verify', clientIp, 30, 60);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please wait before retrying.' },
      {
        status: 429,
        headers: { 'Retry-After': rateLimit.resetSeconds.toString() },
      }
    );
  }

  // 3. Extract and Validate payment_id
  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get('payment_id')?.trim();

  if (!paymentId || !PAYMENT_ID_REGEX.test(paymentId)) {
    return NextResponse.json(
      { error: 'Invalid or missing payment_id parameter.' },
      { status: 400 }
    );
  }

  const apiKey = process.env.DODO_SECRET_KEY || process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) {
    console.error('[Payment Verification] Missing DODO_SECRET_KEY in server environment.');
    return NextResponse.json(
      { error: 'Payment gateway verification unavailable.' },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();

  // 4. Check if listing is ALREADY fulfilled in Supabase
  const { data: existingPaidBid } = await supabase
    .from('bids')
    .select('*')
    .eq('stripe_payment_intent_id', paymentId)
    .limit(1)
    .maybeSingle();

  if (existingPaidBid) {
    return NextResponse.json({
      success: true,
      idempotent: true,
      status: 'succeeded',
      listing: existingPaidBid,
    });
  }

  // 5. Query Dodo Payments API directly to verify payment status
  try {
    const dodoBaseUrl = getDodoBaseUrl();
    const dodoRes = await fetch(`${dodoBaseUrl}/payments/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!dodoRes.ok) {
      const errBody = await dodoRes.text().catch(() => '');
      console.error(`[Payment Verification] Dodo API error (${dodoRes.status}):`, errBody);
      return NextResponse.json(
        { error: 'Failed to verify payment with payment gateway.' },
        { status: 404 }
      );
    }

    const dodoData = await dodoRes.json();

    if (dodoData.status !== 'succeeded') {
      return NextResponse.json({
        success: false,
        status: dodoData.status,
        message: 'Payment is not yet confirmed by provider.',
      });
    }

    // 6. Extract and sanitize metadata from verified payment
    const metadata = dodoData.metadata || {};
    const rawUrl = metadata.url;
    const category = sanitizeString(metadata.category || 'Other', 50);

    const parsedAmount = parseInt(String(metadata.bid_amount || dodoData.total_amount || 0), 10);
    const bidAmountCents = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;

    const isTopUp = metadata.is_topup === 'true' || metadata.is_topup === true;
    const existingBidId = typeof metadata.existing_bid_id === 'string' ? metadata.existing_bid_id.trim() : '';

    const title = sanitizeString(metadata.title, 100) || null;
    const description = sanitizeString(metadata.description, 300) || null;

    let iconUrl = typeof metadata.icon_url === 'string' ? metadata.icon_url.trim() : null;
    if (iconUrl && !isSafePublicUrl(iconUrl)) {
      iconUrl = null;
    }

    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json(
        { error: 'No valid destination URL associated with this payment.' },
        { status: 400 }
      );
    }

    // 7. Check if target listing already exists by ID or URL
    let targetBidId = existingBidId;
    if (!targetBidId) {
      const { data: existingBid } = await supabase
        .from('bids')
        .select('id')
        .eq('url', rawUrl)
        .limit(1)
        .maybeSingle();

      if (existingBid) {
        targetBidId = existingBid.id;
      }
    }

    if (targetBidId || isTopUp) {
      console.log(`[Payment Verification] Reconciling existing listing ${targetBidId || rawUrl} to $${bidAmountCents / 100}...`);

      const { data: updatedData, error: updateErr } = await supabase
        .from('bids')
        .update({
          amount: bidAmountCents,
          status: 'paid',
          stripe_payment_intent_id: paymentId,
          category,
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          ...(iconUrl ? { icon_url: iconUrl } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetBidId)
        .select('*')
        .single();

      if (updateErr || !updatedData) {
        const { data: fallbackUpdated } = await supabase
          .from('bids')
          .update({
            amount: bidAmountCents,
            status: 'paid',
            stripe_payment_intent_id: paymentId,
            category,
            updated_at: new Date().toISOString(),
          })
          .eq('url', rawUrl)
          .select('*')
          .single();

        return NextResponse.json({
          success: true,
          verified: true,
          listing: fallbackUpdated,
        });
      }

      return NextResponse.json({
        success: true,
        verified: true,
        listing: updatedData,
      });
    } else {
      console.log(`[Payment Verification] Inserting newly verified listing for ${rawUrl} ($${bidAmountCents / 100})...`);

      const { data: insertedData, error: insertErr } = await supabase
        .from('bids')
        .insert({
          url: rawUrl,
          amount: bidAmountCents,
          status: 'paid',
          stripe_payment_intent_id: paymentId,
          category,
          title,
          description,
          icon_url: iconUrl,
          click_count: 0,
          view_count: 0,
        })
        .select('*')
        .single();

      if (insertErr) {
        console.error('[Payment Verification Insert Fallback]:', insertErr);
        const fallback = await supabase
          .from('bids')
          .insert({
            url: rawUrl,
            amount: bidAmountCents,
            status: 'paid',
            stripe_payment_intent_id: paymentId,
            title,
            description,
          })
          .select('*')
          .single();

        return NextResponse.json({
          success: true,
          verified: true,
          listing: fallback.data,
        });
      }

      return NextResponse.json({
        success: true,
        verified: true,
        listing: insertedData,
      });
    }
  } catch (verifyErr: any) {
    console.error('[Payment Verification Exception]:', verifyErr);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}
