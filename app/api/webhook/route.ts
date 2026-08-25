import { NextRequest, NextResponse } from 'next/server';
import { Webhooks } from '@dodopayments/nextjs';
import { supabaseAdmin } from '@/utils/supabase/admin';

async function processWebhookPayload(payload: any) {
  const eventType = payload?.type || payload?.eventType;
  console.log('[Dodo Payments Webhook] Processing event:', eventType);

  if (eventType === 'payment.succeeded' || eventType === 'checkout.session.completed') {
    const paymentData = payload.data || payload;
    const bidId =
      paymentData.metadata?.bid_id ||
      paymentData.metadata?.bidId ||
      paymentData.client_reference_id;

    if (!bidId) {
      console.error('[Dodo Webhook] No bid_id found in metadata:', paymentData.metadata);
      return;
    }

    const paymentId = paymentData.payment_id || paymentData.id || null;
    console.log(`[Dodo Webhook] Marking bid ${bidId} as paid. Payment ID: ${paymentId}`);

    const { error: updateError } = await supabaseAdmin
      .from('bids')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentId,
      })
      .eq('id', bidId);

    if (updateError) {
      console.error(`[Dodo Webhook] Failed to update bid ${bidId}:`, updateError);
    } else {
      console.log(`[Dodo Webhook] Bid ${bidId} marked as paid successfully!`);
    }
  } else if (eventType === 'payment.failed') {
    const paymentData = payload.data || payload;
    const bidId = paymentData.metadata?.bid_id || paymentData.client_reference_id;

    if (bidId) {
      console.log(`[Dodo Webhook] Marking bid ${bidId} as failed.`);
      await supabaseAdmin
        .from('bids')
        .update({
          status: 'failed',
        })
        .eq('id', bidId);
    }
  }
}

export async function POST(req: NextRequest) {
  const webhookKey = process.env.DODO_PAYMENTS_WEBHOOK_KEY || '';

  // Use Dodo's signature verification when a real webhook secret is configured
  if (webhookKey && !webhookKey.includes('your_webhook_secret') && webhookKey.length >= 10) {
    try {
      const handler = Webhooks({
        webhookKey,
        onPayload: async (payload: any) => {
          await processWebhookPayload(payload);
        },
      });
      return await handler(req);
    } catch (err: any) {
      console.error('[Dodo Webhook Error]:', err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  // Fallback handler for development/testing
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody || '{}');
    await processWebhookPayload(payload);
    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('[Webhook Parse Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
