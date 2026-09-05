import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';
import { createAdminClient } from '@/utils/supabase/admin';
import { checkRateLimit, RATE_LIMITS } from '@/utils/rateLimit';
import { getClientIp } from '@/utils/securityUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isRequestAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(RATE_LIMITS.ADMIN_ACTION.action, clientIp, RATE_LIMITS.ADMIN_ACTION.limit, RATE_LIMITS.ADMIN_ACTION.windowSeconds);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many admin requests. Please wait ${rateLimit.resetSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': rateLimit.resetSeconds.toString() } }
    );
  }

  try {
    const searchParams = req.nextUrl.searchParams;
    const limitParam = parseInt(searchParams.get('limit') || '200', 10);
    const safeLimit = Math.max(1, Math.min(1000, isNaN(limitParam) ? 200 : limitParam));

    const supabase = createAdminClient();

    const { data: bids, error } = await supabase
      .from('bids')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      console.error('[Admin Bids Query Error]:', error);
      throw error;
    }

    const safeBids = bids || [];
    const paidBids = safeBids.filter((b) => b.status === 'paid');
    const totalVolumeCents = paidBids.reduce((acc, b) => acc + (b.amount || 0), 0);

    return NextResponse.json(
      {
        bids: safeBids,
        stats: {
          totalCount: safeBids.length,
          paidCount: paidBids.length,
          pendingCount: safeBids.filter((b) => b.status === 'pending').length,
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
    console.error('[Admin Bids Route Exception]:', err);
    return NextResponse.json({ error: 'Failed to fetch bids.' }, { status: 500 });
  }
}
