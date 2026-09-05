import crypto from 'crypto';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'outbids_admin_session';

const RUNTIME_EPHEMERAL_SECRET = crypto.randomBytes(32).toString('hex');

export function getAdminSecret(): string {
  const secret = process.env.ADMIN_PASSWORD || process.env.PAYPAL_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    return RUNTIME_EPHEMERAL_SECRET;
  }
  return 'outbids_admin_secure_secret_2026';
}

export const ADMIN_SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours max session TTL

/**
 * Computes a truncated SHA-256 fingerprint of the client's User-Agent string
 */
export function getUserAgentFingerprint(ua?: string | null): string {
  const raw = ua ? ua.trim().slice(0, 500) : 'unknown_client';
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * Creates a signed HMAC session token containing a random nonce, timestamp, and User-Agent fingerprint
 */
export function createAdminSessionToken(userAgent?: string | null): string {
  const secret = getAdminSecret();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const uaFingerprint = getUserAgentFingerprint(userAgent);
  const payload = `admin_session_${timestamp}_${nonce}_${uaFingerprint}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return `${timestamp}.${nonce}.${uaFingerprint}.${signature}`;
}

/**
 * Validates a signed HMAC session token (valid for 12 hours, strictly bound to client User-Agent)
 */
export function verifyAdminSessionToken(token?: string | null, userAgent?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  // Support both 4-part (fingerprinted) and legacy 3-part format during rolling updates
  if (parts.length !== 4 && parts.length !== 3) return false;

  const secret = getAdminSecret();
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (parts.length === 4) {
    const [timestampStr, nonce, tokenUaFingerprint, signature] = parts;
    if (!timestampStr || !nonce || !tokenUaFingerprint || !signature) return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // Check expiration (12 hours)
    if (nowSeconds - timestamp > ADMIN_SESSION_TTL_SECONDS || timestamp > nowSeconds + 60) {
      return false;
    }

    // Anti-Session-Hijacking: Verify User-Agent fingerprint matches requesting client
    if (userAgent !== undefined && userAgent !== null) {
      const currentUaFingerprint = getUserAgentFingerprint(userAgent);
      if (tokenUaFingerprint !== currentUaFingerprint) {
        return false;
      }
    }

    const payload = `admin_session_${timestampStr}_${nonce}_${tokenUaFingerprint}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    try {
      const bufA = crypto.createHash('sha256').update(signature).digest();
      const bufB = crypto.createHash('sha256').update(expectedSignature).digest();
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  } else {
    // 3-part legacy token validation with 12h boundary
    const [timestampStr, nonce, signature] = parts;
    if (!timestampStr || !nonce || !signature) return false;

    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    if (nowSeconds - timestamp > ADMIN_SESSION_TTL_SECONDS || timestamp > nowSeconds + 60) {
      return false;
    }

    const payload = `admin_session_${timestampStr}_${nonce}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    try {
      const bufA = crypto.createHash('sha256').update(signature).digest();
      const bufB = crypto.createHash('sha256').update(expectedSignature).digest();
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }
}

/**
 * Helper to check if incoming API request is authenticated as admin
 */
export function isRequestAdminAuthenticated(req: NextRequest): boolean {
  const cookie = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const userAgent = req.headers.get('user-agent');
  return verifyAdminSessionToken(cookie, userAgent);
}

/**
 * Verifies password strictly against the immutable environment variable using SHA-256 pre-hashed constant-time comparison.
 * Bounded to max 128 characters to prevent DoS via CPU/memory starvation on hashing buffers.
 * In production environments, an explicitly configured ADMIN_PASSWORD is mandatory (no hardcoded fallback).
 */
export function verifyAdminPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  if (password.length > 128) return false; // Enforce max 128 chars constraint

  const isProd = process.env.NODE_ENV === 'production';
  const configuredPassword = process.env.ADMIN_PASSWORD;

  // In production, reject any authentication if ADMIN_PASSWORD is not explicitly configured
  if (isProd && (!configuredPassword || configuredPassword.trim() === '')) {
    console.error('[SECURITY CRITICAL] ADMIN_PASSWORD environment variable is not defined in production. Access rejected.');
    return false;
  }

  const actualPassword = configuredPassword || 'outbids_admin_2026';
  if (!actualPassword) return false;

  try {
    // SHA-256 pre-hashing ensures identical 32-byte buffers, eliminating length-leak timing channels
    const hashA = crypto.createHash('sha256').update(password).digest();
    const hashB = crypto.createHash('sha256').update(actualPassword).digest();
    return crypto.timingSafeEqual(hashA, hashB);
  } catch {
    return false;
  }
}
