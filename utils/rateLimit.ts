import crypto from 'crypto';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory token bucket store per action namespace
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup stale rate limit records every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (record.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitConfig {
  action: string;
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Anonymously hashes an IP address with action salt for privacy-preserving rate limiting
 */
export function getRateLimitKey(action: string, identifier: string): string {
  const salt = process.env.ADMIN_PASSWORD || process.env.PAYPAL_SECRET || 'outbids_rate_salt';
  const hashedIdentifier = crypto
    .createHmac('sha256', salt)
    .update(`${action}:${identifier}`)
    .digest('hex')
    .slice(0, 32);
  return `${action}:${hashedIdentifier}`;
}

/**
 * Evaluates sliding window rate limits for a given identifier
 */
export function checkRateLimit(
  action: string,
  identifier: string,
  limit: number = 10,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const key = getRateLimitKey(action, identifier);
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const record: RateLimitRecord = {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    };
    rateLimitStore.set(key, record);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
    };
  }

  if (existing.count >= limit) {
    const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  existing.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    resetSeconds,
  };
}

/**
 * Preconfigured Rate Limits across Platform Actions
 */
export const RATE_LIMITS = {
  AUTH_LOGIN: { action: 'auth_login', limit: 5, windowSeconds: 60 },
  AUTH_CHANGE_PASS: { action: 'auth_change_pass', limit: 3, windowSeconds: 60 },
  CHECKOUT_PAID: { action: 'checkout_paid', limit: 15, windowSeconds: 60 },
  CHECKOUT_FREE: { action: 'checkout_free', limit: 2, windowSeconds: 3600 },
  CLICK_REDIRECT: { action: 'click_redirect', limit: 60, windowSeconds: 60 },
  ADMIN_ACTION: { action: 'admin_action', limit: 30, windowSeconds: 60 },
};
