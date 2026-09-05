import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';
import { createAdminClient } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';
import { recordAdminAuditLog } from '@/utils/adminAudit';
import { isSafePublicUrl } from '@/utils/metadata';
import { checkRateLimit, RATE_LIMITS } from '@/utils/rateLimit';
import { getClientIp, isValidUuid, validateRequestOrigin } from '@/utils/securityUtils';
import { PLATFORM_CATEGORIES } from '@/types/bid';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = new Set(['paid', 'pending', 'failed', 'refunded', 'disputed']);

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Cross-Origin Request Validation (CSRF mitigation)
  if (!validateRequestOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden: Cross-origin request rejected.' }, { status: 403 });
  }

  // 2. Strictly verify admin authentication session
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 401 });
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
    // 2. Initialize Supabase Admin client with Service Role Key to bypass RLS
    const supabase = createAdminClient();

    // 3. Fetch existing state for audit log and existence check
    const { data: existingBid, error: fetchError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .maybeSingle();

    if (fetchError) {
      console.error('[Admin Delete Fetch Error]:', fetchError);
      return NextResponse.json(
        { error: 'Database service unavailable while fetching listing.' },
        { status: 500 }
      );
    }

    if (!existingBid) {
      return NextResponse.json(
        { error: 'Listing not found in database.' },
        { status: 404 }
      );
    }

    // 4. Clean up any related analytics tracking events
    try {
      await supabase.from('analytics_events').delete().eq('bid_id', bidId);
    } catch (cascadeErr) {
      console.warn('[Admin Delete Analytics Cleanup Warning]:', cascadeErr);
    }

    // 5. Execute deletion on bids table
    const { error: deleteError } = await supabase
      .from('bids')
      .delete()
      .eq('id', bidId);

    if (deleteError) {
      console.error('[Admin Delete Mutation Error]:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete listing due to database constraint.' },
        { status: 500 }
      );
    }

    // 6. Instantly purge Next.js router cache for both admin portal and public board
    revalidatePath('/admin');
    revalidatePath('/');

    // 7. Record security audit log
    await recordAdminAuditLog({
      action: 'ADMIN_DELETED_BID',
      targetId: bidId,
      targetUrl: existingBid.url,
      previousState: existingBid,
      ipHash: getClientIp(req),
    });

    return NextResponse.json({
      success: true,
      message: `Listing for "${existingBid.title || existingBid.url}" permanently removed.`,
    });
  } catch (err: any) {
    console.error('[Admin Delete Unhandled Exception]:', err);
    return NextResponse.json(
      { error: 'Unexpected server error occurred while deleting listing.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Cross-Origin Request Validation (CSRF mitigation)
  if (!validateRequestOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden: Cross-origin request rejected.' }, { status: 403 });
  }

  // 2. Strictly verify admin authentication session
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 401 });
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
    const body = await req.json().catch(() => ({}));
    const { amountInDollars, amountInCents, url, category, status, title, description, icon_url } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof amountInDollars === 'number' && isFinite(amountInDollars)) {
      updates.amount = Math.max(0, Math.min(100000000, Math.round(amountInDollars * 100)));
    } else if (typeof amountInCents === 'number' && isFinite(amountInCents)) {
      updates.amount = Math.max(0, Math.min(100000000, Math.round(amountInCents)));
    }

    if (url && typeof url === 'string') {
      const { isValid, normalizedUrl } = sanitizeAndNormalizeUrl(url);
      if (isValid && normalizedUrl && isSafePublicUrl(normalizedUrl)) {
        updates.url = normalizedUrl;
      }
    }

    if (category && typeof category === 'string') {
      const trimmedCat = category.trim();
      if ((PLATFORM_CATEGORIES as readonly string[]).includes(trimmedCat)) {
        updates.category = trimmedCat;
      }
    }

    if (status && typeof status === 'string' && ALLOWED_STATUSES.has(status)) {
      updates.status = status;
    }

    if (title !== undefined) {
      updates.title = title ? String(title).trim().slice(0, 100) : null;
    }

    if (description !== undefined) {
      updates.description = description ? String(description).trim().slice(0, 300) : null;
    }

    if (icon_url !== undefined) {
      const cleanIcon = icon_url ? String(icon_url).trim().slice(0, 500) : null;
      if (cleanIcon && isSafePublicUrl(cleanIcon)) {
        updates.icon_url = cleanIcon;
      } else {
        updates.icon_url = null;
      }
    }

    const supabase = createAdminClient();

    // Fetch previous state
    const { data: previousBid } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .maybeSingle();

    const { data: updated, error } = await supabase
      .from('bids')
      .update(updates)
      .eq('id', bidId)
      .select()
      .single();

    if (error) {
      console.error('[Admin Bid Patch Error]:', error);
      return NextResponse.json(
        { error: 'Failed to update listing in database.' },
        { status: 500 }
      );
    }

    // Purge Next.js router cache
    revalidatePath('/admin');
    revalidatePath('/');

    await recordAdminAuditLog({
      action: 'ADMIN_UPDATED_BID',
      targetId: bidId,
      targetUrl: updated?.url,
      previousState: previousBid,
      newState: updated,
      ipHash: getClientIp(req),
    });

    return NextResponse.json({ success: true, bid: updated, message: 'Listing updated successfully.' });
  } catch (err: any) {
    console.error('[Admin Bid Patch Exception]:', err);
    return NextResponse.json(
      { error: 'Failed to update listing.' },
      { status: 500 }
    );
  }
}
