import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  updateAdminPassword,
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
} from '@/utils/adminAuth';
import { checkRateLimit, RATE_LIMITS } from '@/utils/rateLimit';
import { recordAdminAuditLog } from '@/utils/adminAudit';
import { getClientIp } from '@/utils/securityUtils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  // Rate limit password change attempts
  const rateLimit = checkRateLimit(
    RATE_LIMITS.AUTH_CHANGE_PASS.action,
    clientIp,
    RATE_LIMITS.AUTH_CHANGE_PASS.limit,
    RATE_LIMITS.AUTH_CHANGE_PASS.windowSeconds
  );

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many password change attempts. Please wait ${rateLimit.resetSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': rateLimit.resetSeconds.toString() } }
    );
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // 1. Validation checks
    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Current password is required to authorize changes.' },
        { status: 400 }
      );
    }

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Please enter and confirm your new password.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    // 2. Authenticate current password
    const isCurrentValid = verifyAdminPassword(currentPassword);
    if (!isCurrentValid) {
      await recordAdminAuditLog({
        action: 'ADMIN_LOGIN_FAILED',
        ipHash: clientIp,
        reason: 'Failed current password check during password change attempt',
      });
      return NextResponse.json(
        { error: 'Current password verification failed. Please try again.' },
        { status: 401 }
      );
    }

    // 3. Update password securely and advance epoch
    await updateAdminPassword(newPassword);

    await recordAdminAuditLog({
      action: 'ADMIN_CHANGED_PASSWORD',
      ipHash: clientIp,
    });

    // 4. Issue updated session cookie
    const sessionToken = createAdminSessionToken();
    const response = NextResponse.json({
      success: true,
      message: 'Admin password updated successfully. Your new credentials are now active.',
    });

    response.cookies.set(ADMIN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[Admin Change Password Error]:', err);
    return NextResponse.json(
      { error: 'Failed to update admin password.' },
      { status: 500 }
    );
  }
}
