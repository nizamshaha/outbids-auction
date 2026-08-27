import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const ADMIN_COOKIE_NAME = 'outbids_admin_session';

// Runtime in-memory cache for dynamically updated passwords and session epoch
let cachedAdminPassword: string | null = null;
let currentSessionEpoch = Math.floor(Date.now() / 1000);

export function getAdminSecret(): string {
  return (
    cachedAdminPassword ||
    process.env.ADMIN_PASSWORD ||
    process.env.PAYPAL_SECRET ||
    'outbids_admin_secure_secret_2026'
  );
}

/**
 * Creates a signed HMAC session token containing a random nonce, timestamp, and epoch
 */
export function createAdminSessionToken(): string {
  const secret = getAdminSecret();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `admin_session_${currentSessionEpoch}_${timestamp}_${nonce}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `${currentSessionEpoch}.${timestamp}.${nonce}.${signature}`;
}

/**
 * Validates a signed HMAC session token (valid for 7 days, invalidated on epoch/password change)
 */
export function verifyAdminSessionToken(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 4) return false;

  const [epochStr, timestampStr, nonce, signature] = parts;
  if (!epochStr || !timestampStr || !nonce || !signature) return false;

  const epoch = parseInt(epochStr, 10);
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(epoch) || isNaN(timestamp)) return false;

  // Check epoch validity (invalidates past tokens upon master password change)
  if (epoch < currentSessionEpoch) return false;

  // Check expiration (7 days in seconds)
  const maxAgeSeconds = 7 * 24 * 60 * 60;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds - timestamp > maxAgeSeconds || timestamp > nowSeconds + 60) {
    return false;
  }

  const secret = getAdminSecret();
  const payload = `admin_session_${epochStr}_${timestampStr}_${nonce}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  try {
    const bufA = Buffer.from(signature);
    const bufB = Buffer.from(expectedSignature);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
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
  if (!password || typeof password !== 'string' || !actualPassword) return false;

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
 * Updates the active admin password in memory and attempts persistence in Supabase,
 * advancing the session epoch to invalidate all previous sessions.
 */
export async function updateAdminPassword(newPassword: string): Promise<boolean> {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  cachedAdminPassword = newPassword;
  currentSessionEpoch = Math.floor(Date.now() / 1000);

  try {
    const supabase = createAdminClient();
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
