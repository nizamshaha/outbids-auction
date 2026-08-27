import { NextRequest, NextResponse } from 'next/server';
import {
  verifyAdminPassword,
  updateAdminPassword,
  createAdminSessionToken,
  ADMIN_COOKIE_NAME,
  isRequestAdminAuthenticated,
} from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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
      return NextResponse.json(
        { error: 'Current password verification failed. Please try again.' },
        { status: 401 }
      );
    }

    // 3. Update password securely
    await updateAdminPassword(newPassword);

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
      { error: err?.message || 'Failed to update admin password.' },
      { status: 500 }
    );
  }
}
