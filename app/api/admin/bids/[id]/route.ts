import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';
import { createAdminClient } from '@/utils/supabase/admin';

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
    const { amountInDollars, category, status, title, description } = body;

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof amountInDollars === 'number') {
      updates.amount = Math.round(amountInDollars * 100);
    }
    if (category) updates.category = category;
    if (status) updates.status = status;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    const supabase = createAdminClient();
    const { data: updated, error } = await supabase
      .from('bids')
      .update(updates)
      .eq('id', bidId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, bid: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update bid.' }, { status: 500 });
  }
}
