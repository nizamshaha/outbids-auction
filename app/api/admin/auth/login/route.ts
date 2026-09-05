import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_TTL_SECONDS,
} from '@/utils/adminAuth';
import {
  checkProgressiveLockout,
  recordFailedAuthAttempt,
  resetAuthAttempts,
} from '@/utils/rateLimit';
import { recordAdminAuditLog } from '@/utils/adminAudit';
import { getClientIp, validateRequestOrigin } from '@/utils/securityUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest | Request) {
  // 0. Cross-Origin Request Validation (CSRF mitigation)
  if (req instanceof NextRequest && !validateRequestOrigin(req)) {
    return new Response(
      JSON.stringify({ error: 'Forbidden: Cross-origin authentication rejected.' }),
      { status: 403, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { password } = body;
    const clientIp =
      (req instanceof NextRequest ? getClientIp(req) : null) ||
      req.headers.get('x-real-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown_ip';
    const userAgent = req.headers.get('user-agent') || 'unknown_ua';

    // 1. Strict Type and Size Validation (Computational DoS Guardrail)
    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid request format.' }), 
        { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    if (password.length > 128) {
      await recordAdminAuditLog({
        action: 'ADMIN_LOGIN_FAILED',
        ipHash: clientIp,
        reason: 'Oversized password payload attempt (>128 chars)',
      });
      return new Response(
        JSON.stringify({ error: 'Invalid credentials.' }), // Generic error prevents logic discovery
        { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    // 2. Progressive Lockout Check
    const lockoutState = await checkProgressiveLockout(clientIp);
    if (lockoutState.isLocked) {
      await recordAdminAuditLog({
        action: 'ADMIN_LOCKOUT_TRIGGERED',
        ipHash: clientIp,
        reason: `Blocked by active security lockout (${lockoutState.remainingSeconds}s remaining)`,
      });
      return new Response(
        JSON.stringify({ error: `Too many attempts. Try again in ${lockoutState.remainingSeconds}s.` }), 
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            'Retry-After': String(lockoutState.remainingSeconds),
          },
        }
      );
    }

    // 3. Constant-Time SHA-256 Verification (Zero Length Leakage)
    const isProd = process.env.NODE_ENV === 'production';
    const configuredPassword = process.env.ADMIN_PASSWORD;

    if (isProd && (!configuredPassword || configuredPassword.trim() === '')) {
      console.error(
        '[SECURITY CRITICAL] ADMIN_PASSWORD environment variable is not defined in production. Access rejected.'
      );
      await recordFailedAuthAttempt(clientIp);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials.' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    const expectedPassword = configuredPassword || 'outbids_admin_2026';

    // Hash both values to guarantee identical 32-byte buffers
    const inputHash = crypto.createHash('sha256').update(password).digest();
    const expectedHash = crypto.createHash('sha256').update(expectedPassword).digest();

    if (!crypto.timingSafeEqual(inputHash, expectedHash)) {
      const failRecord = await recordFailedAuthAttempt(clientIp);
      await recordAdminAuditLog({
        action: failRecord.isLocked ? 'ADMIN_LOCKOUT_TRIGGERED' : 'ADMIN_LOGIN_FAILED',
        ipHash: clientIp,
        reason: failRecord.isLocked
          ? 'Lockout triggered: 5 consecutive failed passwords'
          : `Invalid credentials (attempt ${failRecord.count})`,
      });

      return new Response(
        JSON.stringify({ error: 'Invalid credentials.' }), 
        { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    // 4. Success: Reset lockout, generate User-Agent bound token, set strict cookies
    resetAuthAttempts(clientIp);

    await recordAdminAuditLog({
      action: 'ADMIN_LOGIN_SUCCESS',
      ipHash: clientIp,
    });

    const sessionToken = createAdminSessionToken(userAgent);
    const isHttps =
      (req instanceof NextRequest && req.nextUrl.protocol === 'https:') ||
      req.headers.get('x-forwarded-proto') === 'https';

    const response = new Response(
      JSON.stringify({ success: true, message: 'Admin authenticated.' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'Set-Cookie': `${ADMIN_COOKIE_NAME}=${sessionToken}; Path=/; Max-Age=${ADMIN_SESSION_TTL_SECONDS}; SameSite=Strict; HttpOnly${
            isProd || isHttps ? '; Secure' : ''
          }`,
        },
      }
    );

    return response;
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: 'Authentication failed.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
}
