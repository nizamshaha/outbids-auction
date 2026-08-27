import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    const { data: bids, error } = await supabase
      .from('bids')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const paidBids = bids.filter((b) => b.status === 'paid');
    const totalVolumeCents = paidBids.reduce((acc, b) => acc + (b.amount || 0), 0);

    return NextResponse.json(
      {
        bids: bids || [],
        stats: {
          totalCount: bids.length,
          paidCount: paidBids.length,
          pendingCount: bids.filter((b) => b.status === 'pending').length,
          totalVolumeDollars: totalVolumeCents / 100,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch bids.' }, { status: 500 });
  }
}
