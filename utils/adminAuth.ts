import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'outbids_admin_session';

function getAdminSecret(): string {
  return process.env.ADMIN_PASSWORD || process.env.PAYPAL_SECRET || 'outbids_admin_secure_secret_2026';
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
 * Verifies password against environment variable
 */
export function verifyAdminPassword(password: string): boolean {
  const actualPassword = process.env.ADMIN_PASSWORD || 'outbids_admin_2026';
  return Boolean(password && password === actualPassword);
}
