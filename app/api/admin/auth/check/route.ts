import { NextRequest, NextResponse } from 'next/server';
import { isRequestAdminAuthenticated } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const isAuthenticated = isRequestAdminAuthenticated(req);
  return NextResponse.json({ authenticated: isAuthenticated });
}
