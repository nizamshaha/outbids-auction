import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function hashIp(ip: string): string {
  const salt = process.env.PAYPAL_SECRET || 'outbids_analytics_salt';
  return crypto.createHmac('sha256', salt).update(ip).digest('hex');
}

const BOT_USER_AGENT_PATTERN =
  /(bot|spider|crawl|slurp|facebookexternalhit|whatsapp|telegrambot|twitterbot|slackbot|discordbot|applebot|bingbot|googlebot|yandex|duckduckgo|baiduspider|embedly|quora|linkedinbot|pinterest)/i;

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const bidId = searchParams.get('id');
  const targetUrl = searchParams.get('to');

  if (!targetUrl) {
    return NextResponse.redirect('https://outbids.auction');
  }

  // Ensure target URL has valid protocol
  const sanitizedUrl = targetUrl.startsWith('http://') || targetUrl.startsWith('https://')
    ? targetUrl
    : `https://${targetUrl}`;

  if (!bidId) {
    return NextResponse.redirect(sanitizedUrl);
  }

  // Filter out automated crawler requests
  const userAgent = req.headers.get('user-agent') || '';
  if (BOT_USER_AGENT_PATTERN.test(userAgent)) {
    return NextResponse.redirect(sanitizedUrl);
  }

  try {
    const rawIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

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
      // 1. Record unique click event
      await supabase.from('analytics_events').insert({
        bid_id: bidId,
        ip_hash: ipHash,
        event_type: 'click',
      });

      // 2. Increment click count on bid
      const { data: currentBid } = await supabase
        .from('bids')
        .select('click_count')
        .eq('id', bidId)
        .single();

      const newCount = (currentBid?.click_count || 0) + 1;

      await supabase
        .from('bids')
        .update({ click_count: newCount })
        .eq('id', bidId);
    }
  } catch (err) {
    console.error('[Click Tracking Error]:', err);
  }

  return NextResponse.redirect(sanitizedUrl);
}
