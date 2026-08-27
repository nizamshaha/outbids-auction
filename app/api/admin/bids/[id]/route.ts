import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';
import { createAdminClient } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';
import { recordAdminAuditLog } from '@/utils/adminAudit';

export const dynamic = 'force-dynamic';

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Strictly verify admin authentication session
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 401 });
  }

  const bidId = params.id;
  if (!bidId) {
    return NextResponse.json({ error: 'Bid ID is required.' }, { status: 400 });
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
        { error: `Database fetch error: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!existingBid) {
      return NextResponse.json(
        { error: `Listing with ID "${bidId}" not found in database.` },
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
        { error: deleteError.message || 'Row Level Security policy blocked deletion.' },
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
      { error: err?.message || 'Unexpected server error occurred while deleting listing.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 401 });
  }

  const bidId = params.id;
  if (!bidId) {
    return NextResponse.json({ error: 'Bid ID is required.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { amountInDollars, amountInCents, url, category, status, title, description, icon_url } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof amountInDollars === 'number') {
      updates.amount = Math.max(0, Math.min(100000000, Math.round(amountInDollars * 100)));
    } else if (typeof amountInCents === 'number') {
      updates.amount = Math.max(0, Math.min(100000000, Math.round(amountInCents)));
    }

    if (url && typeof url === 'string') {
      const { isValid, normalizedUrl } = sanitizeAndNormalizeUrl(url);
      if (isValid && normalizedUrl) {
        updates.url = normalizedUrl;
      }
    }

    if (category && typeof category === 'string') updates.category = category.trim().slice(0, 50);
    if (status === 'paid' || status === 'pending' || status === 'failed' || status === 'refunded' || status === 'disputed') {
      updates.status = status;
    }
    if (title !== undefined) updates.title = title ? String(title).trim().slice(0, 100) : null;
    if (description !== undefined) updates.description = description ? String(description).trim().slice(0, 300) : null;
    if (icon_url !== undefined) updates.icon_url = icon_url ? String(icon_url).trim() : null;

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
        { error: error.message || 'Failed to update listing in database.' },
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
      { error: err?.message || 'Failed to update listing.' },
      { status: 500 }
    );
  }
}
