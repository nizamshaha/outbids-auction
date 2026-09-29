import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/utils/supabase/admin';

export const revalidate = 60; // Cache for 60 seconds

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.outbids.auction';

  try {
    const supabase = getSupabaseAdmin();
    const { data: bids, error } = await supabase
      .from('bids')
      .select('id, title, url, description, amount, category, created_at')
      .eq('status', 'paid')
      .order('amount', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(30);

    const itemsXml = (bids || [])
      .map((bid, index) => {
        const rank = index + 1;
        const amountDollars = (bid.amount / 100).toFixed(2);
        const title = escapeXml(`[#${rank}] ${bid.title || 'Featured Project'} ($${amountDollars})`);
        const link = `${baseUrl}/go/${bid.id}`;
        const description = escapeXml(
          `${bid.description || 'Promoted on OutBids.auction live leaderboard.'} - Category: ${
            bid.category || 'General'
          } - Outbid value: $${amountDollars}`
        );
        const pubDate = new Date(bid.created_at || Date.now()).toUTCString();

        return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      })
      .join('\n');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OutBids.auction - Live Attention Marketplace Feed</title>
    <link>${baseUrl}</link>
    <description>Live ranked attention leaderboard of top products, websites, and startups bidding for visibility.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(rssFeed, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (err: unknown) {
    console.error('Error generating RSS feed:', err);
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8" ?><rss version="2.0"><channel><title>OutBids.auction</title><link>${baseUrl}</link></channel></rss>`,
      {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        status: 200,
      }
    );
  }
}
