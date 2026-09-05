import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(req: NextRequest) {
  const isAuthenticated = isRequestAdminAuthenticated(req);
  return NextResponse.json({ authenticated: isAuthenticated }, { headers: NO_CACHE_HEADERS });
}
