import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/utils/adminAuth';
import { validateRequestOrigin, getClientIp } from '@/utils/securityUtils';
import { recordAdminAuditLog } from '@/utils/adminAudit';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(req: NextRequest) {
  if (!validateRequestOrigin(req)) {
    return NextResponse.json(
      { error: 'Forbidden: Cross-origin request rejected.' },
      { status: 403, headers: NO_CACHE_HEADERS }
    );
  }

  const clientIp = getClientIp(req);
  await recordAdminAuditLog({
    action: 'ADMIN_LOGOUT',
    ipHash: clientIp,
  });

  const response = NextResponse.json(
    { success: true, message: 'Logged out successfully.' },
    { headers: NO_CACHE_HEADERS }
  );

  const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';

  // Explicitly zero and expire the session cookie across the entire domain
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || isHttps,
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
