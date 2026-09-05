import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';
import { createAdminClient } from '@/utils/supabase/admin';
import { scrapeUrlMetadata, isSafePublicUrl } from '@/utils/metadata';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';
import { checkRateLimit, RATE_LIMITS } from '@/utils/rateLimit';
import { getClientIp, isValidUuid, validateRequestOrigin } from '@/utils/securityUtils';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Cross-Origin Request Validation (CSRF mitigation)
  if (!validateRequestOrigin(req)) {
    return NextResponse.json(
      { error: 'Forbidden: Cross-origin request rejected.' },
      { status: 403, headers: NO_CACHE_HEADERS }
    );
  }

  // 2. Strictly verify admin authentication session
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin privileges required.' },
      { status: 401, headers: NO_CACHE_HEADERS }
    );
  }

  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(RATE_LIMITS.ADMIN_ACTION.action, clientIp, RATE_LIMITS.ADMIN_ACTION.limit, RATE_LIMITS.ADMIN_ACTION.windowSeconds);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many admin actions. Please wait ${rateLimit.resetSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': rateLimit.resetSeconds.toString() } }
    );
  }

  const bidId = params.id;
  if (!bidId || !isValidUuid(bidId)) {
    return NextResponse.json({ error: 'Valid UUID Bid ID is required.' }, { status: 400 });
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

    const safeIconUrl = scraped.iconUrl && isSafePublicUrl(scraped.iconUrl) ? scraped.iconUrl : null;

    // Update in Supabase
    const { data: updated, error: updateError } = await supabase
      .from('bids')
      .update({
        title: scraped.title || displayDomain,
        description: scraped.description,
        icon_url: safeIconUrl,
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
    return NextResponse.json({ error: 'Failed to refresh metadata.' }, { status: 500 });
  }
}
