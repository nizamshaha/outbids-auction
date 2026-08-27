import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { Webhook } from 'standardwebhooks';
import { isSafePublicUrl } from '@/utils/metadata';
import { sanitizeString } from '@/utils/securityUtils';

export const dynamic = 'force-dynamic';

// Maximum allowable timestamp variance to mitigate webhook replay attacks (5 minutes)
const MAX_TIMESTAMP_TOLERANCE_SECONDS = 300;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Dodo Webhook Security] Missing DODO_PAYMENTS_WEBHOOK_KEY in server environment.');
      return NextResponse.json(
        { error: 'Webhook secret is not configured on server.' },
        { status: 500 }
      );
    }

    // Standard Webhook Headers
    const webhookId = req.headers.get('webhook-id') || '';
    const webhookTimestamp = req.headers.get('webhook-timestamp') || '';
    const webhookSignature = req.headers.get('webhook-signature') || '';

    if (!webhookSignature || !webhookId || !webhookTimestamp) {
      console.warn('[Dodo Webhook Security] Missing required standard webhook signature headers.');
      return NextResponse.json(
        { error: 'Missing webhook signature headers.' },
        { status: 401 }
      );
    }

    // Replay attack prevention: verify timestamp freshness
    const timestampInt = parseInt(webhookTimestamp, 10);
    if (!isNaN(timestampInt)) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (Math.abs(nowSeconds - timestampInt) > MAX_TIMESTAMP_TOLERANCE_SECONDS) {
        console.warn(`[Dodo Webhook Security] Webhook timestamp outside allowed window (${nowSeconds - timestampInt}s delta).`);
        return NextResponse.json(
          { error: 'Webhook timestamp expired or invalid.' },
          { status: 401 }
        );
      }
    }

    const headers = {
      'webhook-id': webhookId,
      'webhook-timestamp': webhookTimestamp,
      'webhook-signature': webhookSignature,
    };

    let event: any;

    try {
      const wh = new Webhook(webhookSecret);
      event = wh.verify(rawBody, headers);
    } catch (verifyError: any) {
      console.error('[Dodo Webhook Security] Cryptographic signature verification failed:', verifyError?.message);
      return NextResponse.json(
        { error: 'Invalid webhook signature.' },
        { status: 401 }
      );
    }

    const eventType = event?.type || event?.event_type;
    const data = event?.data || event;

    console.log(`[Dodo Webhook] Verified event: ${eventType} (ID: ${webhookId})`);

    const supabase = createAdminClient();

    // -------------------------------------------------------------
    // 1. Handle Payment Succeeded Event
    // -------------------------------------------------------------
    if (eventType === 'payment.succeeded' || eventType === 'payment_succeeded' || data?.status === 'succeeded') {
      const paymentId = String(data?.payment_id || data?.id || '').trim();
      const metadata = data?.metadata || {};

      const rawUrl = metadata?.url;
      const category = sanitizeString(metadata?.category || 'Other', 50);
      
      const parsedAmount = parseInt(String(metadata?.bid_amount || data?.total_amount || 0), 10);
      const bidAmountCents = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
      
      const isTopUp = metadata?.is_topup === 'true' || metadata?.is_topup === true;
      const existingBidId = typeof metadata?.existing_bid_id === 'string' ? metadata.existing_bid_id.trim() : '';
      
      const title = sanitizeString(metadata?.title, 100) || null;
      const description = sanitizeString(metadata?.description, 300) || null;
      
      let iconUrl = typeof metadata?.icon_url === 'string' ? metadata.icon_url.trim() : null;
      if (iconUrl && !isSafePublicUrl(iconUrl)) {
        iconUrl = null;
      }

      if (!rawUrl || typeof rawUrl !== 'string') {
        console.warn('[Dodo Webhook] No valid target URL in verified metadata:', metadata);
        return NextResponse.json({ received: true, message: 'No target URL provided in metadata.' });
      }

      if (bidAmountCents <= 0) {
        console.warn('[Dodo Webhook] Invalid bid amount in verified metadata:', bidAmountCents);
        return NextResponse.json({ received: true, message: 'Invalid non-positive bid amount.' });
      }

      // Idempotency check: Ensure payment intent is not re-processed
      if (paymentId) {
        const { data: existingPayment } = await supabase
          .from('bids')
          .select('id, amount, stripe_payment_intent_id')
          .eq('stripe_payment_intent_id', paymentId)
          .limit(1)
          .maybeSingle();

        if (existingPayment) {
          console.log(`[Dodo Webhook] Payment ${paymentId} already processed for listing ${existingPayment.id}. Idempotent return.`);
          return NextResponse.json({ received: true, idempotent: true });
        }
      }

      // Check if target listing exists by ID or URL
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
        console.log(`[Dodo Webhook] Upgrading listing ${targetBidId || rawUrl} to $${bidAmountCents / 100}...`);

        const { data: updatedData, error: updateErr } = await supabase
          .from('bids')
          .update({
            amount: bidAmountCents,
            status: 'paid',
            stripe_payment_intent_id: paymentId || null,
            category,
            ...(title ? { title } : {}),
            ...(description ? { description } : {}),
            ...(iconUrl ? { icon_url: iconUrl } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetBidId)
          .select('id');

        if (updateErr || !updatedData || updatedData.length === 0) {
          // If targeted ID was stale, update by URL
          await supabase
            .from('bids')
            .update({
              amount: bidAmountCents,
              status: 'paid',
              stripe_payment_intent_id: paymentId || null,
              category,
              updated_at: new Date().toISOString(),
            })
            .eq('url', rawUrl);
        }

        console.log(`[Dodo Webhook] Listing upgraded successfully for ${rawUrl}!`);
      } else {
        console.log(`[Dodo Webhook] Inserting new paid listing for ${rawUrl} ($${bidAmountCents / 100})...`);

        const { error: insertErr } = await supabase
          .from('bids')
          .insert({
            url: rawUrl,
            amount: bidAmountCents,
            status: 'paid',
            stripe_payment_intent_id: paymentId || null,
            category,
            title,
            description,
            icon_url: iconUrl,
            click_count: 0,
            view_count: 0,
          });

        if (insertErr) {
          // Fallback if rich columns are pending migration
          const fallback = await supabase
            .from('bids')
            .insert({
              url: rawUrl,
              amount: bidAmountCents,
              status: 'paid',
              stripe_payment_intent_id: paymentId || null,
              title,
              description,
            });

          if (fallback.error) {
            console.error('[Dodo Webhook] Database Insert Error:', fallback.error);
            throw fallback.error;
          }
        }

        console.log(`[Dodo Webhook] Successfully inserted verified listing for ${rawUrl}!`);
      }
    }

    // -------------------------------------------------------------
    // 2. Handle Refund Succeeded / Dispute Created Events
    // -------------------------------------------------------------
    if (
      eventType === 'refund.succeeded' ||
      eventType === 'payment.refunded' ||
      eventType === 'dispute.opened' ||
      eventType === 'dispute.created'
    ) {
      const paymentId = String(data?.payment_id || data?.id || '').trim();
      if (paymentId) {
        console.log(`[Dodo Webhook] Processing refund/dispute event ${eventType} for payment ${paymentId}`);
        await supabase
          .from('bids')
          .update({
            status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentId);
      }
    }

    return NextResponse.json({ received: true, status: 'success' });
  } catch (err: any) {
    console.error('[Dodo Webhook Security Handler Error]:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
