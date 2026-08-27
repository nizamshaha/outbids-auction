import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';
import { createAdminClient } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';

export const dynamic = 'force-dynamic';

export async function DELETE(
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

    const { error } = await supabase.from('bids').delete().eq('id', bidId);
    if (error) throw error;

    return NextResponse.json({ success: true, message: `Bid ${bidId} removed successfully.` });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete bid.' }, { status: 500 });
  }
}

export async function PATCH(
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
    const body = await req.json();
    const { amountInDollars, amountInCents, url, category, status, title, description, icon_url } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof amountInDollars === 'number') {
      updates.amount = Math.max(0, Math.round(amountInDollars * 100));
    } else if (typeof amountInCents === 'number') {
      updates.amount = Math.max(0, Math.round(amountInCents));
    }

    if (url && typeof url === 'string') {
      const { isValid, normalizedUrl } = sanitizeAndNormalizeUrl(url);
      if (isValid && normalizedUrl) {
        updates.url = normalizedUrl;
      }
    }

    if (category) updates.category = category;
    if (status) updates.status = status;
    if (title !== undefined) updates.title = title ? String(title).trim().slice(0, 100) : null;
    if (description !== undefined) updates.description = description ? String(description).trim().slice(0, 300) : null;
    if (icon_url !== undefined) updates.icon_url = icon_url || null;

    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from('bids')
      .update(updates)
      .eq('id', bidId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, bid: updated, message: 'Listing updated successfully.' });
  } catch (err: any) {
    console.error('[Admin Bid Patch Error]:', err);
    return NextResponse.json({ error: err?.message || 'Failed to update bid.' }, { status: 500 });
  }
}
