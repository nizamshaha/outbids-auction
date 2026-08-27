import { NextRequest, NextResponse } from 'next/server';
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
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin privileges required.' }, { status: 401 });
  }

  const bidId = params.id;
  if (!bidId) {
    return NextResponse.json({ error: 'Bid ID is required.' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch existing state for audit log
    const { data: existingBid } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single();

    const { error } = await supabase.from('bids').delete().eq('id', bidId);
    if (error) throw error;

    await recordAdminAuditLog({
      action: 'ADMIN_DELETED_BID',
      targetId: bidId,
      targetUrl: existingBid?.url,
      previousState: existingBid,
      ipHash: getClientIp(req),
    });

    return NextResponse.json({ success: true, message: `Listing ${bidId} removed successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to delete listing.' }, { status: 500 });
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
    if (status === 'paid' || status === 'pending' || status === 'failed') updates.status = status;
    if (title !== undefined) updates.title = title ? String(title).trim().slice(0, 100) : null;
    if (description !== undefined) updates.description = description ? String(description).trim().slice(0, 300) : null;
    if (icon_url !== undefined) updates.icon_url = icon_url ? String(icon_url).trim() : null;

    const supabase = createAdminClient();

    // Fetch previous state
    const { data: previousBid } = await supabase
      .from('bids')
      .select('*')
      .eq('id', bidId)
      .single();

    const { data: updated, error } = await supabase
      .from('bids')
      .update(updates)
      .eq('id', bidId)
      .select()
      .single();

    if (error) throw error;

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
    console.error('[Admin Bid Patch Error]:', err);
    return NextResponse.json({ error: 'Failed to update listing.' }, { status: 500 });
  }
}
