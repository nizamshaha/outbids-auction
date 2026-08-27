import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/utils/paypal';
import { createAdminClient } from '@/utils/supabase/admin';

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

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/?canceled=true`);
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

    if (topUpTargetId) {
      // Fetch target existing bid authoritatively
      const { data: targetBid } = await supabase
        .from('bids')
        .select('id, amount')
        .eq('id', topUpTargetId)
        .single();

      if (targetBid) {
        const authoritativeNewAmount = (targetBid.amount || 0) + capturedCents;
        console.log(`[PayPal Capture] Authoritatively applying Top-Up: ${topUpTargetId} -> $${authoritativeNewAmount / 100}`);

        await supabase
          .from('bids')
          .update({
            amount: authoritativeNewAmount,
            status: 'paid',
            stripe_payment_intent_id: token,
            updated_at: new Date().toISOString(),
          })
          .eq('id', topUpTargetId);

        // Remove temporary placeholder if separate
        if (bidId && bidId !== topUpTargetId) {
          await supabase.from('bids').delete().eq('id', bidId);
        }
      }
    } else {
      const targetBidId =
        bidId ||
        captureResult.purchase_units?.[0]?.custom_id ||
        captureUnit?.custom_id;

      if (targetBidId) {
        const { data: currentBid } = await supabase
          .from('bids')
          .select('id, amount')
          .eq('id', targetBidId)
          .single();

        if (currentBid) {
          await supabase
            .from('bids')
            .update({
              amount: Math.max(currentBid.amount, capturedCents),
              status: 'paid',
              stripe_payment_intent_id: token,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetBidId);

          console.log(`[PayPal Capture] Successfully marked bid ${targetBidId} as PAID ($${capturedCents / 100})!`);
        }
      }
    }

    return NextResponse.redirect(`${siteUrl}/?success=true`);
  } catch (err: any) {
    console.error('[PayPal Capture Error]:', err);
    return NextResponse.redirect(`${siteUrl}/?error=paypal_capture_failed`);
  }
}
