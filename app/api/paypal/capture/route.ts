import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/utils/paypal';
import { createAdminClient } from '@/utils/supabase/admin';
import { checkRateLimit, RATE_LIMITS } from '@/utils/rateLimit';
import { getClientIp, isValidUuid } from '@/utils/securityUtils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token'); // PayPal Order ID
  const bidId = searchParams.get('bid_id');
  const topUpTargetId = searchParams.get('top_up_target');

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin ||
    'https://outbids.auction';

  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit('paypal_capture', clientIp, 15, 60);
  if (!rateLimit.success) {
    return NextResponse.redirect(`${siteUrl}/?error=rate_limited`);
  }

  if (!token || typeof token !== 'string' || token.length > 100) {
    return NextResponse.redirect(`${siteUrl}/?canceled=true`);
  }

  if (bidId && !isValidUuid(bidId)) {
    return NextResponse.redirect(`${siteUrl}/?error=invalid_id`);
  }

  if (topUpTargetId && !isValidUuid(topUpTargetId)) {
    return NextResponse.redirect(`${siteUrl}/?error=invalid_id`);
  }

  try {
    console.log(`[PayPal Capture] Capturing verified order: ${token}`);
    const captureResult = await capturePayPalOrder(token);

    const isCompleted =
      captureResult.status === 'COMPLETED' ||
      captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.status === 'COMPLETED';

    if (!isCompleted) {
      console.warn('[PayPal Capture] Order was not completed:', captureResult.status);
      return NextResponse.redirect(`${siteUrl}/?canceled=true`);
    }

    // Authoritatively extract captured amount in cents from PayPal API response
    const captureUnit = captureResult.purchase_units?.[0]?.payments?.captures?.[0];
    const capturedDollarsStr = captureUnit?.amount?.value || captureResult.purchase_units?.[0]?.amount?.value || '0';
    const capturedCents = Math.round(parseFloat(capturedDollarsStr) * 100);

    if (capturedCents <= 0) {
      console.error('[PayPal Capture] Captured amount was invalid or zero:', capturedDollarsStr);
      return NextResponse.redirect(`${siteUrl}/?error=invalid_amount`);
    }

    const supabase = createAdminClient();

    // Idempotency: Check if PayPal capture ID was already processed
    const { data: existingPayment } = await supabase
      .from('bids')
      .select('id')
      .eq('stripe_payment_intent_id', token)
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      console.log(`[PayPal Capture] Order ${token} already processed for bid ${existingPayment.id}.`);
      return NextResponse.redirect(`${siteUrl}/?success=true`);
    }

    const authoritativeBidId =
      captureResult.purchase_units?.[0]?.custom_id ||
      captureUnit?.custom_id ||
      topUpTargetId ||
      bidId;

    if (!authoritativeBidId) {
      console.warn('[PayPal Capture] No target bid ID found in PayPal order or parameters.');
      return NextResponse.redirect(`${siteUrl}/?success=true`);
    }

    // Fetch target bid authoritatively from database
    const { data: targetBid } = await supabase
      .from('bids')
      .select('id, amount, status')
      .eq('id', authoritativeBidId)
      .maybeSingle();

    if (targetBid) {
      const isTopUpOrder = Boolean(topUpTargetId && topUpTargetId === authoritativeBidId);
      const updatedAmount = isTopUpOrder
        ? (targetBid.amount || 0) + capturedCents
        : Math.max(targetBid.amount || 0, capturedCents);

      await supabase
        .from('bids')
        .update({
          amount: updatedAmount,
          status: 'paid',
          stripe_payment_intent_id: token,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authoritativeBidId);

      // Clean up temporary placeholder if separate
      if (bidId && bidId !== authoritativeBidId) {
        try {
          await supabase.from('bids').delete().eq('id', bidId);
        } catch {}
      }

      console.log(`[PayPal Capture] Successfully applied payment to listing ${authoritativeBidId} ($${capturedCents / 100})!`);
    }

    return NextResponse.redirect(`${siteUrl}/?success=true`);
  } catch (err: any) {
    console.error('[PayPal Capture Error]:', err);
    return NextResponse.redirect(`${siteUrl}/?error=paypal_capture_failed`);
  }
}
