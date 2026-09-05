import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
} from '@/utils/adminAuth';
import {
  checkRateLimit,
  RATE_LIMITS,
  checkProgressiveLockout,
  recordFailedAuthAttempt,
  resetAuthAttempts,
} from '@/utils/rateLimit';
import { recordAdminAuditLog } from '@/utils/adminAudit';
import { getClientIp, validateRequestOrigin } from '@/utils/securityUtils';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function POST(req: NextRequest) {
  // 1. Cross-Origin Request Validation (CSRF mitigation)
  if (!validateRequestOrigin(req)) {
    return NextResponse.json(
      { error: 'Forbidden: Cross-origin authentication rejected.' },
      { status: 403, headers: NO_CACHE_HEADERS }
    );
  }

  const clientIp = getClientIp(req);

  // 2. Check progressive brute-force security lockout (15 minutes on 5 consecutive failures)
  const lockout = checkProgressiveLockout(clientIp);
  if (lockout.isLocked) {
    await recordAdminAuditLog({
      action: 'ADMIN_LOCKOUT_TRIGGERED',
      ipHash: clientIp,
      reason: `Blocked by active security lockout (${lockout.remainingSeconds}s remaining)`,
    });
    return NextResponse.json(
      {
        error: `Security Lockout Active: IP locked due to repeated failed attempts. Try again in ${Math.ceil(
          lockout.remainingSeconds / 60
        )} minutes.`,
      },
      {
        status: 429,
        headers: {
          ...NO_CACHE_HEADERS,
          'Retry-After': lockout.remainingSeconds.toString(),
        },
      }
    );
  }

  // 3. Sliding-window rate limiting: max 5 attempts per 60 seconds
  const rateLimit = checkRateLimit(
    RATE_LIMITS.AUTH_LOGIN.action,
    clientIp,
    RATE_LIMITS.AUTH_LOGIN.limit,
    RATE_LIMITS.AUTH_LOGIN.windowSeconds
  );
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many failed login attempts. Please wait ${rateLimit.resetSeconds} seconds before trying again.` },
      {
        status: 429,
        headers: {
          ...NO_CACHE_HEADERS,
          'Retry-After': rateLimit.resetSeconds.toString(),
        },
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const password = body?.password;

    if (!password || typeof password !== 'string' || password.length > 128) {
      const failRecord = recordFailedAuthAttempt(clientIp);
      await recordAdminAuditLog({
        action: failRecord.isLocked ? 'ADMIN_LOCKOUT_TRIGGERED' : 'ADMIN_LOGIN_FAILED',
        ipHash: clientIp,
        reason: 'Invalid or oversized credentials supplied',
      });

      return NextResponse.json(
        {
          error: failRecord.isLocked
            ? 'Account locked for 15 minutes due to consecutive failed attempts.'
            : 'Invalid admin credentials.',
        },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      const failRecord = recordFailedAuthAttempt(clientIp);
      await recordAdminAuditLog({
        action: failRecord.isLocked ? 'ADMIN_LOCKOUT_TRIGGERED' : 'ADMIN_LOGIN_FAILED',
        ipHash: clientIp,
        reason: failRecord.isLocked
          ? 'Lockout triggered: 5 consecutive failed passwords'
          : `Invalid credentials (attempt ${failRecord.count})`,
      });

      return NextResponse.json(
        {
          error: failRecord.isLocked
            ? 'Account locked for 15 minutes due to consecutive failed attempts.'
            : 'Invalid admin credentials.',
        },
        { status: 401, headers: NO_CACHE_HEADERS }
      );
    }

    // Reset failed counter upon verified authentication
    resetAuthAttempts(clientIp);

    await recordAdminAuditLog({
      action: 'ADMIN_LOGIN_SUCCESS',
      ipHash: clientIp,
    });

    const userAgent = req.headers.get('user-agent');
    const sessionToken = createAdminSessionToken(userAgent);
    const response = NextResponse.json(
      { success: true, message: 'Admin authenticated.' },
      { headers: NO_CACHE_HEADERS }
    );

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';

    // Set secure HttpOnly cookie (valid for 12 hours, SameSite: Strict)
    response.cookies.set(ADMIN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || isHttps,
      sameSite: 'strict',
      path: '/',
      maxAge: ADMIN_SESSION_TTL_SECONDS, // 12 hours in seconds
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Authentication failed.' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
