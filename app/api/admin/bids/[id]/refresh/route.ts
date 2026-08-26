import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';
import { createAdminClient } from '@/utils/supabase/admin';
import { scrapeUrlMetadata } from '@/utils/metadata';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bidId = params.id;
  if (!bidId) {
    return NextResponse.json({ error: 'Bid ID is required.' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch existing bid
    const { data: bid, error: fetchError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single();

    if (fetchError || !bid) {
      return NextResponse.json({ error: 'Bid not found.' }, { status: 404 });
    }

    const { normalizedUrl, displayDomain } = sanitizeAndNormalizeUrl(bid.url);

    // Run scraper on target URL
    console.log(`[Admin Refresh] Re-scraping metadata for ${normalizedUrl}...`);
    const scraped = await scrapeUrlMetadata(normalizedUrl);

    // Update in Supabase
    const { data: updated, error: updateError } = await supabase
      .from('bids')
      .update({
        title: scraped.title || displayDomain,
        description: scraped.description,
        icon_url: scraped.iconUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bidId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      bid: updated,
      message: `Metadata refreshed for ${displayDomain}!`,
    });
  } catch (err: any) {
    console.error('[Admin Refresh Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to refresh metadata.' }, { status: 500 });
  }
}
