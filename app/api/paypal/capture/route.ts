import { NextRequest, NextResponse } from 'next/server';
import { capturePayPalOrder } from '@/utils/paypal';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token'); // PayPal Order ID
  const bidId = searchParams.get('bid_id');
  const topUpTargetId = searchParams.get('top_up_target');
  const newAmountStr = searchParams.get('new_amount');

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.nextUrl.origin ||
    'https://outbids.auction';

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/?canceled=true`);
  }

  try {
    console.log(`[PayPal Capture] Capturing order: ${token} (bidId: ${bidId}, topUpTarget: ${topUpTargetId})`);
    const captureResult = await capturePayPalOrder(token);

    const isCompleted =
      captureResult.status === 'COMPLETED' ||
      captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.status === 'COMPLETED';

    if (isCompleted) {
      const supabase = createAdminClient();

      if (topUpTargetId && newAmountStr) {
        const newTotalAmount = parseInt(newAmountStr, 10);
        console.log(`[PayPal Capture] Applying Top-Up to bid ${topUpTargetId} -> New Amount: $${newTotalAmount / 100}`);

        // 1. Update existing bid to higher amount and latest update time
        await supabase
          .from('bids')
          .update({
            amount: newTotalAmount,
            status: 'paid',
            stripe_payment_intent_id: token,
            updated_at: new Date().toISOString(),
          })
          .eq('id', topUpTargetId);

        // 2. Remove temporary pending record if different
        if (bidId && bidId !== topUpTargetId) {
          await supabase.from('bids').delete().eq('id', bidId);
        }
      } else {
        const targetBidId =
          bidId ||
          captureResult.purchase_units?.[0]?.custom_id ||
          captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;

        if (targetBidId) {
          const { error: updateError } = await supabase
            .from('bids')
            .update({
              status: 'paid',
              stripe_payment_intent_id: token,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetBidId);

          if (updateError) {
            console.error('[PayPal Capture] Failed to update bid status:', updateError);
          } else {
            console.log(`[PayPal Capture] Successfully marked bid ${targetBidId} as PAID!`);
          }
        }
      }

      return NextResponse.redirect(`${siteUrl}/?success=true`);
    } else {
      console.warn('[PayPal Capture] Capture was not completed:', captureResult.status);
      return NextResponse.redirect(`${siteUrl}/?canceled=true`);
    }
  } catch (err: any) {
    console.error('[PayPal Capture] Error capturing order:', err);
    return NextResponse.redirect(`${siteUrl}/?error=paypal_capture_failed`);
  }
}
