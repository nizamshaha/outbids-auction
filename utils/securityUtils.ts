import { NextRequest } from 'next/server';
import crypto from 'crypto';

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

/**
 * Extracts and validates the authoritative client IP address.
 * Prioritizes runtime socket/edge IP (req.ip), followed by trusted CDN/Platform headers.
 */
export function getClientIp(req: NextRequest): string {
  // 1. Authoritative runtime socket/edge IP (cannot be spoofed by HTTP request headers)
  const runtimeIp = (req as any).ip;
  if (runtimeIp && (IPV4_REGEX.test(runtimeIp) || IPV6_REGEX.test(runtimeIp))) {
    return runtimeIp.trim();
  }

  // 2. Vercel trusted edge header
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const candidate = vercelIp.split(',')[0].trim();
    if (IPV4_REGEX.test(candidate) || IPV6_REGEX.test(candidate)) {
      return candidate;
    }
  }

  // 3. Cloudflare trusted edge header
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && (IPV4_REGEX.test(cfIp) || IPV6_REGEX.test(cfIp))) {
    return cfIp.trim();
  }

  // 4. Standard X-Real-IP set by reverse proxy
  const realIp = req.headers.get('x-real-ip');
  if (realIp && (IPV4_REGEX.test(realIp) || IPV6_REGEX.test(realIp))) {
    return realIp.trim();
  }

  // 5. Fallback forwarded header
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const candidate = forwarded.split(',')[0].trim();
    if (IPV4_REGEX.test(candidate) || IPV6_REGEX.test(candidate)) {
      return candidate;
    }
  }

  return '127.0.0.1';
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
