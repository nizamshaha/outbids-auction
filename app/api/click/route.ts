import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { checkRateLimit, RATE_LIMITS } from '@/utils/rateLimit';
import { getClientIp } from '@/utils/securityUtils';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashIp(ip: string): string {
  const salt = process.env.ADMIN_PASSWORD || process.env.PAYPAL_SECRET || 'outbids_analytics_salt_2026';
  return crypto.createHmac('sha256', salt).update(ip).digest('hex');
}

const BOT_USER_AGENT_PATTERN =
  /(bot|spider|crawl|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|slackbot|discordbot|applebot|bingbot|googlebot|yandex|duckduckgo|baiduspider|embedly|quora|linkedinbot|pinterest)/i;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const bidId = searchParams.get('id');
  const targetUrl = searchParams.get('to');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://outbids.auction';

  if (!targetUrl) {
    return NextResponse.redirect(siteUrl);
  }

  // Ensure target URL is valid and begins with http:// or https://
  let sanitizedUrl: string;
  try {
    const parsed = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.redirect(siteUrl);
    }
    sanitizedUrl = parsed.toString();
  } catch {
    return NextResponse.redirect(siteUrl);
  }

  if (!bidId) {
    return NextResponse.redirect(sanitizedUrl);
  }

  const userAgent = req.headers.get('user-agent') || '';
  if (BOT_USER_AGENT_PATTERN.test(userAgent)) {
    return NextResponse.redirect(sanitizedUrl);
  }

  const rawIp = getClientIp(req);

  // Rate limit click actions per IP
  const rateLimit = checkRateLimit(RATE_LIMITS.CLICK_REDIRECT.action, rawIp, RATE_LIMITS.CLICK_REDIRECT.limit, RATE_LIMITS.CLICK_REDIRECT.windowSeconds);
  if (!rateLimit.success) {
    return NextResponse.redirect(sanitizedUrl);
  }

  try {
    const ipHash = hashIp(rawIp);
    const supabase = createAdminClient();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentClicks, error: checkError } = await supabase
      .from('analytics_events')
      .select('id')
      .eq('bid_id', bidId)
      .eq('ip_hash', ipHash)
      .gte('created_at', twentyFourHoursAgo)
      .limit(1);

    if (!checkError && (!recentClicks || recentClicks.length === 0)) {
      await supabase.from('analytics_events').insert({
        bid_id: bidId,
        ip_hash: ipHash,
        event_type: 'click',
      });

      const { data: currentBid } = await supabase
        .from('bids')
        .select('click_count')
        .eq('id', bidId)
        .single();

      if (currentBid) {
        await supabase
          .from('bids')
          .update({ click_count: (currentBid.click_count || 0) + 1 })
          .eq('id', bidId);
      }
    }
  } catch (err) {
    console.error('[Click Tracking Error]:', err);
  }

  return NextResponse.redirect(sanitizedUrl);
}
