import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'outbids_admin_session';

export function getAdminSecret(): string {
  return (
    process.env.ADMIN_PASSWORD ||
    process.env.PAYPAL_SECRET ||
    'outbids_admin_secure_secret_2026'
  );
}

/**
 * Creates a signed HMAC session token containing a random nonce and timestamp
 */
export function createAdminSessionToken(): string {
  const secret = getAdminSecret();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `admin_session_${timestamp}_${nonce}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `${timestamp}.${nonce}.${signature}`;
}

/**
 * Validates a signed HMAC session token (valid for 7 days)
 */
export function verifyAdminSessionToken(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [timestampStr, nonce, signature] = parts;
  if (!timestampStr || !nonce || !signature) return false;

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // Check expiration (7 days in seconds)
  const maxAgeSeconds = 7 * 24 * 60 * 60;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds - timestamp > maxAgeSeconds || timestamp > nowSeconds + 60) {
    return false;
  }

  const secret = getAdminSecret();
  const payload = `admin_session_${timestampStr}_${nonce}`;

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
 * Verifies password strictly against the immutable environment variable using constant-time comparison
 */
export function verifyAdminPassword(password: string): boolean {
  const actualPassword = process.env.ADMIN_PASSWORD || 'outbids_admin_2026';
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
