import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword, createAdminSessionToken, ADMIN_COOKIE_NAME } from '@/utils/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Invalid admin credentials.' }, { status: 401 });
    }

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
    return NextResponse.json({ error: err?.message || 'Login failed.' }, { status: 500 });
  }
}
