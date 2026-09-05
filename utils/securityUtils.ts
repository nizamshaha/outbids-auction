import { NextRequest } from 'next/server';
import crypto from 'crypto';

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

/**
 * Extracts and validates the authoritative client IP address.
 * Prioritizes runtime socket/edge IP, followed by trusted reverse proxy (Hostinger/Nginx x-real-ip, Cloudflare cf-connecting-ip),
 * and only trusts provider-specific headers (e.g. x-vercel-forwarded-for) if running in that provider's environment.
 */
export function getClientIp(req: NextRequest): string {
  // 1. Authoritative runtime socket/edge IP (cannot be spoofed by HTTP request headers)
  const runtimeIp = (req as any).ip;
  if (runtimeIp && (IPV4_REGEX.test(runtimeIp) || IPV6_REGEX.test(runtimeIp))) {
    return runtimeIp.trim();
  }

  // 2. Cloudflare trusted edge header (set by Cloudflare reverse proxy)
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && (IPV4_REGEX.test(cfIp) || IPV6_REGEX.test(cfIp))) {
    return cfIp.trim();
  }

  // 3. Standard X-Real-IP set directly by Hostinger / Nginx reverse proxy to remote client socket
  const realIp = req.headers.get('x-real-ip');
  if (realIp && (IPV4_REGEX.test(realIp) || IPV6_REGEX.test(realIp))) {
    return realIp.trim();
  }

  // 4. Vercel edge header (ONLY trusted when actively running on Vercel platform)
  if (process.env.VERCEL === '1') {
    const vercelIp = req.headers.get('x-vercel-forwarded-for');
    if (vercelIp) {
      const candidate = vercelIp.split(',')[0].trim();
      if (IPV4_REGEX.test(candidate) || IPV6_REGEX.test(candidate)) {
        return candidate;
      }
    }
  }

  // 5. Fallback forwarded header: take rightmost entry added by reverse proxy or single IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim());
    // Traverse from right to left to prioritize reverse-proxy appended entries
    for (let i = parts.length - 1; i >= 0; i--) {
      const candidate = parts[i];
      if (IPV4_REGEX.test(candidate) || IPV6_REGEX.test(candidate)) {
        return candidate;
      }
    }
  }

  return '127.0.0.1';
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LOOSE_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates whether an input string is a valid UUIDv4 or standard UUID
 */
export function isValidUuid(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  return LOOSE_UUID_REGEX.test(id.trim());
}

/**
 * Validates request Origin and Sec-Fetch-Site to prevent cross-site request forgery (CSRF)
 * on mutating API routes (POST, PATCH, DELETE).
 */
export function validateRequestOrigin(req: NextRequest): boolean {
  const secFetchSite = req.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    return false;
  }

  const origin = req.headers.get('origin');
  if (!origin) {
    // Non-browser client or same-origin GET/navigation
    return true;
  }

  try {
    const originHost = new URL(origin).host.toLowerCase();
    const currentHost = req.headers.get('host')?.toLowerCase();
    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    const configuredHost = configuredSiteUrl ? new URL(configuredSiteUrl).host.toLowerCase() : null;

    // Direct host match or www/apex match
    if (currentHost) {
      if (
        originHost === currentHost ||
        originHost === `www.${currentHost}` ||
        `www.${originHost}` === currentHost
      ) {
        return true;
      }
    }

    if (configuredHost) {
      if (
        originHost === configuredHost ||
        originHost === `www.${configuredHost}` ||
        `www.${originHost}` === configuredHost
      ) {
        return true;
      }
    }

    // Allow localhost during local development
    if (process.env.NODE_ENV !== 'production' && (originHost.startsWith('localhost:') || originHost === 'localhost')) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Strips script tags, HTML markup, and non-printable control characters
 */
export function sanitizeString(input: unknown, maxLength: number = 200): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Generates a unique cryptographic correlation ID for security tracing
 */
export function generateCorrelationId(): string {
  return `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}
