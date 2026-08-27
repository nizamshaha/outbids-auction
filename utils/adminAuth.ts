import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const ADMIN_COOKIE_NAME = 'outbids_admin_session';

// Runtime in-memory cache for dynamically updated passwords
let cachedAdminPassword: string | null = null;

export function getAdminSecret(): string {
  return cachedAdminPassword || process.env.ADMIN_PASSWORD || process.env.PAYPAL_SECRET || 'outbids_admin_secure_secret_2026';
}

/**
 * Creates a signed HMAC session token
 */
export function createAdminSessionToken(): string {
  const secret = getAdminSecret();
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`admin_session_${timestamp}`)
    .digest('hex');

  return `${timestamp}.${signature}`;
}

/**
 * Validates a signed HMAC session token (valid for 7 days)
 */
export function verifyAdminSessionToken(token?: string | null): boolean {
  if (!token) return false;

  const [timestampStr, signature] = token.split('.');
  if (!timestampStr || !signature) return false;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check expiration (7 days)
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  if (Date.now() - timestamp > maxAge) return false;

  const secret = getAdminSecret();
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`admin_session_${timestampStr}`)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Helper to check if incoming API request is authenticated as admin
 */
export function isRequestAdminAuthenticated(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionToken(cookie);
}

/**
 * Verifies password against runtime cache or environment variable using constant-time comparison
 */
export function verifyAdminPassword(password: string): boolean {
  const actualPassword = cachedAdminPassword || process.env.ADMIN_PASSWORD || 'outbids_admin_2026';
  if (!password || !actualPassword) return false;

  try {
    const bufA = Buffer.from(password);
    const bufB = Buffer.from(actualPassword);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return password === actualPassword;
  }
}

/**
 * Updates the active admin password in memory and attempts persistence in Supabase
 */
export async function updateAdminPassword(newPassword: string): Promise<boolean> {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  cachedAdminPassword = newPassword;

  try {
    const supabase = createAdminClient();
    // Attempt persistence in app_settings table if schema exists
    await (supabase.from as any)('app_settings').upsert({
      key: 'admin_password',
      value: newPassword,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-fatal: in-memory cache remains active for current runtime
    console.warn('[Admin Auth] Supabase app_settings persistence skipped:', err);
  }

  return true;
}
