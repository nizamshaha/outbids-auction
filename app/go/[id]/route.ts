import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { checkRateLimit, RATE_LIMITS } from '@/utils/rateLimit';
import { getClientIp, isValidUuid } from '@/utils/securityUtils';
import { isSafePublicUrl } from '@/utils/metadata';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashIp(ip: string): string {
  const salt = process.env.ADMIN_PASSWORD || process.env.PAYPAL_SECRET || 'outbids_tracked_redirect_salt_2026';
  return crypto.createHmac('sha256', salt).update(ip).digest('hex');
}

const BOT_USER_AGENT_PATTERN =
  /(bot|spider|crawl|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|slackbot|discordbot|applebot|bingbot|googlebot|yandex|duckduckgo|baiduspider|embedly|quora|linkedinbot|pinterest)/i;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const bidId = params.id;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.nextUrl.origin ||
    'https://outbids.auction';

  if (!bidId || !isValidUuid(bidId)) {
    return NextResponse.redirect(siteUrl);
  }

  const rawIp = getClientIp(req);

  // Rate limiting against click flood attacks
  const rateLimit = checkRateLimit(RATE_LIMITS.CLICK_REDIRECT.action, rawIp, RATE_LIMITS.CLICK_REDIRECT.limit, RATE_LIMITS.CLICK_REDIRECT.windowSeconds);

  try {
    const supabase = createAdminClient();

    // 1. Fetch authoritative bid record from Supabase
    const { data: bid, error } = await supabase
      .from('bids')
      .select('id, url, click_count')
      .eq('id', bidId)
      .single();

    if (error || !bid || !bid.url) {
      console.warn(`[Tracked Redirect] Bid ${bidId} not found:`, error?.message);
      return NextResponse.redirect(siteUrl);
    }

    const destinationUrl =
      bid.url.startsWith('http://') || bid.url.startsWith('https://')
        ? bid.url
        : `https://${bid.url}`;

    // Validate destination safety before redirecting (anti-open redirect / anti-internal SSRF)
    if (!isSafePublicUrl(destinationUrl)) {
      console.warn(`[Tracked Redirect Security] Blocked redirect to unsafe/private destination: ${destinationUrl}`);
      return NextResponse.redirect(siteUrl);
    }

    // 2. Filter out bots and automated crawlers from inflating click stats
    const userAgent = req.headers.get('user-agent') || '';
    if (BOT_USER_AGENT_PATTERN.test(userAgent) || !rateLimit.success) {
      return NextResponse.redirect(destinationUrl, { status: 302 });
    }

    // 3. Perform 24-hour unique IP deduplicated click registration
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
      // Record unique click event
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

    return NextResponse.redirect(destinationUrl, { status: 302 });
  } catch (err) {
    console.error('[Tracked Redirect Error]:', err);
    return NextResponse.redirect(siteUrl);
  }
}
