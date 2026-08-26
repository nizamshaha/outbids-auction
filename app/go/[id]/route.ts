import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashIp(ip: string): string {
  const salt = process.env.PAYPAL_SECRET || 'outbids_tracked_redirect_salt';
  return crypto.createHmac('sha256', salt).update(ip).digest('hex');
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bidId = params.id;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin ||
    'https://outbids.auction';

  if (!bidId) {
    return NextResponse.redirect(siteUrl);
  }

  try {
    const supabase = createAdminClient();

    // 1. Fetch bid record from Supabase
    const { data: bid, error } = await supabase
      .from('bids')
      .select('id, url, click_count')
      .eq('id', bidId)
      .single();

    if (error || !bid || !bid.url) {
      console.warn(`[Tracked Redirect] Bid ${bidId} not found:`, error?.message);
      return NextResponse.redirect(siteUrl);
    }

    // 2. Perform 24-hour unique IP deduplicated click registration
    const rawIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const ipHash = hashIp(rawIp);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentClicks } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('bid_id', bidId)
      .eq('ip_hash', ipHash)
      .gte('created_at', twentyFourHoursAgo)
      .limit(1);

    if (!recentClicks || recentClicks.length === 0) {
      // Record new unique click event
      await supabase.from('analytics_events').insert({
        bid_id: bidId,
        ip_hash: ipHash,
        event_type: 'click',
      });

      // Increment click count
      const updatedCount = (bid.click_count || 0) + 1;
      await supabase
        .from('bids')
        .update({ click_count: updatedCount })
        .eq('id', bidId);
    }

    // 3. Ensure proper destination URL protocol
    const destinationUrl =
      bid.url.startsWith('http://') || bid.url.startsWith('https://')
        ? bid.url
        : `https://${bid.url}`;

    return NextResponse.redirect(destinationUrl, { status: 302 });
  } catch (err) {
    console.error('[Tracked Redirect Error]:', err);
    return NextResponse.redirect(siteUrl);
  }
}
