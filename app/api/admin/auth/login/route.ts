import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, createAdminSessionToken, ADMIN_COOKIE_NAME } from '@/utils/adminAuth';
import { checkRateLimit, RATE_LIMITS } from '@/utils/rateLimit';
import { recordAdminAuditLog } from '@/utils/adminAudit';
import { getClientIp } from '@/utils/securityUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // Rate limit admin login attempts: max 5 attempts per 60 seconds
  const rateLimit = checkRateLimit(RATE_LIMITS.AUTH_LOGIN.action, clientIp, RATE_LIMITS.AUTH_LOGIN.limit, RATE_LIMITS.AUTH_LOGIN.windowSeconds);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many failed login attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.` },
      { status: 429, headers: { 'Retry-After': rateLimit.resetSeconds.toString() } }
    );
  }

  try {
    const { password } = await req.json();

    if (!password || !verifyAdminPassword(password)) {
      await recordAdminAuditLog({
        action: 'ADMIN_LOGIN_FAILED',
        ipHash: clientIp,
        reason: 'Invalid credentials supplied',
      });
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

    await recordAdminAuditLog({
      action: 'ADMIN_LOGIN_SUCCESS',
      ipHash: clientIp,
    });

    const sessionToken = createAdminSessionToken();
    const response = NextResponse.json({ success: true, message: 'Admin authenticated.' });

    // Set secure HttpOnly cookie (valid for 7 days)
    response.cookies.set(ADMIN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
  }
}
