import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';
import { createAdminClient } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';
import { scrapeUrlMetadata, isSafePublicUrl, resolveAndValidateDns } from '@/utils/metadata';
import { recordAdminAuditLog } from '@/utils/adminAudit';
import { checkRateLimit, RATE_LIMITS } from '@/utils/rateLimit';
import { getClientIp, sanitizeString, validateRequestOrigin } from '@/utils/securityUtils';
import { PLATFORM_CATEGORIES } from '@/types/bid';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(req: NextRequest) {
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
      { error: 'Unauthorized: Admin authentication required.' },
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

  try {
    const body = await req.json().catch(() => ({}));
    const { url, amountInDollars = 5, category = 'Other', title, description } = body;

    if (!url || typeof url !== 'string' || url.length > 2048) {
      return NextResponse.json({ error: 'Website URL is required (max 2,048 characters).' }, { status: 400 });
    }

    const urlCheck = sanitizeAndNormalizeUrl(url);
    if (!urlCheck.isValid || !urlCheck.normalizedUrl) {
      return NextResponse.json({ error: urlCheck.error || 'Invalid URL format.' }, { status: 400 });
    }

    const normalizedUrl = urlCheck.normalizedUrl;
    if (!isSafePublicUrl(normalizedUrl)) {
      return NextResponse.json({ error: 'Destination URL is restricted or invalid.' }, { status: 400 });
    }

    // Validate DNS resolution to prevent private address seeding
    try {
      const parsedHost = new URL(normalizedUrl).hostname;
      const isDnsSafe = await resolveAndValidateDns(parsedHost);
      if (!isDnsSafe) {
        return NextResponse.json({ error: 'Destination domain resolves to an inaccessible or private network address.' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Failed to resolve destination domain.' }, { status: 400 });
    }

    // Category allow-list validation
    const categoryCandidate = typeof category === 'string' ? category.trim() : 'Other';
    const sanitizedCategory = (PLATFORM_CATEGORIES as readonly string[]).includes(categoryCandidate)
      ? categoryCandidate
      : 'Other';

    const displayDomain = urlCheck.displayDomain;
    const parsedAmount = typeof amountInDollars === 'number' ? amountInDollars : parseFloat(String(amountInDollars));
    const safeAmountNum = isNaN(parsedAmount) || !isFinite(parsedAmount) ? 5 : parsedAmount;
    const amountCents = Math.max(0, Math.min(100000000, Math.round(safeAmountNum * 100)));

    const sanitizedTitle = sanitizeString(title, 100);
    const sanitizedDesc = sanitizeString(description, 300);

    // Scrape metadata if title or description were left blank
    const scraped = await scrapeUrlMetadata(normalizedUrl);
    const finalTitle = sanitizedTitle || scraped.title || displayDomain;
    const finalDescription = sanitizedDesc || scraped.description || null;
    const finalIconUrl = scraped.iconUrl && isSafePublicUrl(scraped.iconUrl) ? scraped.iconUrl : null;

    const supabase = createAdminClient();

    // Check if URL already exists
    const { data: existingBid } = await supabase
      .from('bids')
      .select('*')
      .eq('url', normalizedUrl)
      .limit(1)
      .maybeSingle();

    if (existingBid) {
      // Update existing bid to paid status & new amount
      const { data: updated, error: updateError } = await supabase
        .from('bids')
        .update({
          amount: amountCents,
          status: 'paid',
          category: typeof category === 'string' ? category.slice(0, 50) : 'Other',
          title: finalTitle,
          description: finalDescription,
          icon_url: finalIconUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingBid.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      await recordAdminAuditLog({
        action: 'ADMIN_SEEDED_BID',
        targetId: existingBid.id,
        targetUrl: normalizedUrl,
        previousState: existingBid,
        newState: updated,
        ipHash: getClientIp(req),
      });

      return NextResponse.json({
        success: true,
        action: 'updated',
        bid: updated,
        message: `Successfully updated listing for ${displayDomain} at $${amountInDollars}!`,
      });
    }

    // Insert new paid seeded bid
    const { data: newBid, error: insertError } = await supabase
      .from('bids')
      .insert({
        url: normalizedUrl,
        amount: amountCents,
        status: 'paid',
        category: typeof category === 'string' ? category.slice(0, 50) : 'Other',
        title: finalTitle,
        description: finalDescription,
        icon_url: finalIconUrl,
        click_count: 0,
        view_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      const fallback = await supabase
        .from('bids')
        .insert({
          url: normalizedUrl,
          amount: amountCents,
          status: 'paid',
          title: finalTitle,
          description: finalDescription,
        })
        .select()
        .single();

      if (fallback.error) {
        throw fallback.error;
      }

      await recordAdminAuditLog({
        action: 'ADMIN_SEEDED_BID',
        targetId: fallback.data.id,
        targetUrl: normalizedUrl,
        newState: fallback.data,
        ipHash: getClientIp(req),
      });

      return NextResponse.json({
        success: true,
        action: 'created_fallback',
        bid: fallback.data,
        message: `Successfully seeded ${displayDomain} for $${amountInDollars}!`,
      });
    }

    await recordAdminAuditLog({
      action: 'ADMIN_SEEDED_BID',
      targetId: newBid.id,
      targetUrl: normalizedUrl,
      newState: newBid,
      ipHash: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      action: 'created',
      bid: newBid,
      message: `Successfully seeded ${displayDomain} for $${amountInDollars}!`,
    });
  } catch (err: any) {
    console.error('[Admin Seed Error]:', err);
    return NextResponse.json({ error: 'Failed to seed listing.' }, { status: 500 });
  }
}
