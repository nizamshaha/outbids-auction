import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { createAdminClient } from '@/utils/supabase/admin';
import { isSafePublicUrl } from '@/utils/metadata';

export const dynamic = 'force-dynamic';

const MAX_TIMESTAMP_TOLERANCE_SECONDS = 300;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const webhookSecret = process.env.DODO_PAYMENTS_WEBHOOK_KEY || process.env.DODO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Legacy Webhook Security] Missing webhook secret in server environment.');
      return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
    }

    const webhookId = req.headers.get('webhook-id') || '';
    const webhookTimestamp = req.headers.get('webhook-timestamp') || '';
    const webhookSignature = req.headers.get('webhook-signature') || '';

    if (!webhookSignature || !webhookId || !webhookTimestamp) {
      return NextResponse.json({ error: 'Missing required webhook signature headers.' }, { status: 401 });
    }

    // Replay attack prevention
    const timestampInt = parseInt(webhookTimestamp, 10);
    if (!isNaN(timestampInt)) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (Math.abs(nowSeconds - timestampInt) > MAX_TIMESTAMP_TOLERANCE_SECONDS) {
        return NextResponse.json({ error: 'Webhook timestamp expired.' }, { status: 401 });
      }
    }

    let event: any;
    try {
      const wh = new Webhook(webhookSecret);
      event = wh.verify(rawBody, {
        'webhook-id': webhookId,
        'webhook-timestamp': webhookTimestamp,
        'webhook-signature': webhookSignature,
      });
    } catch {
      return NextResponse.json({ error: 'Invalid cryptographic signature.' }, { status: 401 });
    }

    const eventType = event?.type || event?.event_type;
    const data = event?.data || event;

    if (eventType === 'payment.succeeded' || eventType === 'payment_succeeded' || data?.status === 'succeeded') {
      const paymentId = String(data?.payment_id || data?.id || '').trim();
      const metadata = data?.metadata || {};

      const rawUrl = metadata?.url;
      const category = typeof metadata?.category === 'string' ? metadata.category.slice(0, 50) : 'Other';
      const parsedAmount = parseInt(String(metadata?.bid_amount || data?.total_amount || 0), 10);
      const bidAmountCents = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
      const isTopUp = metadata?.is_topup === 'true' || metadata?.is_topup === true;
      const existingBidId = typeof metadata?.existing_bid_id === 'string' ? metadata.existing_bid_id.trim() : '';
      const title = typeof metadata?.title === 'string' ? metadata.title.slice(0, 100) : null;
      const description = typeof metadata?.description === 'string' ? metadata.description.slice(0, 300) : null;
      let iconUrl = typeof metadata?.icon_url === 'string' ? metadata.icon_url.trim() : null;

      if (iconUrl && !isSafePublicUrl(iconUrl)) {
        iconUrl = null;
      }

      if (!rawUrl || bidAmountCents <= 0) {
        return NextResponse.json({ received: true });
      }

      const supabase = createAdminClient();

      // Idempotency check
      if (paymentId) {
        const { data: existingPayment } = await supabase
          .from('bids')
          .select('id')
          .eq('stripe_payment_intent_id', paymentId)
          .limit(1)
          .maybeSingle();

        if (existingPayment) {
          return NextResponse.json({ received: true, idempotent: true });
        }
      }

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
        await supabase
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
          .eq('id', targetBidId);
      } else {
        await supabase
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
      }
    }

    return NextResponse.json({ received: true, status: 'success' });
  } catch (err: any) {
    console.error('[Legacy Webhook Error]:', err);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
