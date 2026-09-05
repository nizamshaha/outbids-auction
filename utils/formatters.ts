/**
 * Formats USD cents to dollar string (e.g., 500 -> "$5.00", 12500 -> "$125.00")
 */
export function formatCentsToDollars(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

// Tracking parameters to strip during URL canonicalization
const TRACKING_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'ref',
  'referrer',
  'aff',
  'affiliate',
  'aff_id',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'wbraid',
  'gbraid',
  'mc_eid',
  '_ga',
  '_gl',
  'msclkid',
  'twclid',
  'yclid',
]);

// Blocked private invite domains and scam patterns
const BLOCKED_DESTINATION_DOMAINS = [
  'discord.gg',
  'discord.com/invite',
  't.me',
  'telegram.me',
  'signal.group',
  'chat.whatsapp.com',
  'wa.me',
  'chat.signal.me',
];

const BLOCKED_KEYWORD_PATTERNS = [
  /\b(porn|porno|xxx|nsfw|adultwebcam|camgirls|stripchat|onlyfans)\b/i,
  /\b(warez|crackserial|phishing|stealer|malware)\b/i,
];

/**
 * Validates destination content against safety & compliance policies.
 */
export function checkDestinationSafety(url: string, hostname: string): { isSafe: boolean; reason?: string } {
  const lowerUrl = url.toLowerCase();
  const lowerHost = hostname.toLowerCase();

  // 1. Block private group invite links (Discord, Telegram, Signal, WhatsApp)
  for (const blocked of BLOCKED_DESTINATION_DOMAINS) {
    if (lowerUrl.includes(blocked) || lowerHost === blocked) {
      return {
        isSafe: false,
        reason: 'Private group invite links (Discord, Telegram, Signal, WhatsApp) are prohibited on the public leaderboard.',
      };
    }
  }

  // 2. Block prohibited NSFW / adult and illegal categories
  for (const pattern of BLOCKED_KEYWORD_PATTERNS) {
    if (pattern.test(lowerUrl) || pattern.test(lowerHost)) {
      return {
        isSafe: false,
        reason: 'URLs containing adult, NSFW, illegal, or malicious content are strictly prohibited.',
      };
    }
  }

  return { isSafe: true };
}

/**
 * Normalizes, canonicalizes, and validates a URL string or social @handle.
 * - Converts @handle to https://x.com/handle.
 * - Strips marketing tracking query parameters (utm_*, ref, affiliate, fbclid).
 * - Enforces destination safety checks.
 */
export function sanitizeAndNormalizeUrl(rawUrl: string): {
  isValid: boolean;
  normalizedUrl: string;
  displayDomain: string;
  error?: string;
} {
  if (typeof rawUrl !== 'string') {
    return { isValid: false, normalizedUrl: '', displayDomain: '', error: 'URL or @handle is required.' };
  }
  let url = rawUrl.trim();
  if (!url) {
    return { isValid: false, normalizedUrl: '', displayDomain: '', error: 'URL or @handle is required.' };
  }
  if (url.length > 2048) {
    return { isValid: false, normalizedUrl: '', displayDomain: '', error: 'URL exceeds maximum allowable length of 2,048 characters.' };
  }

  // Handle social @handle (e.g., @username -> https://x.com/username)
  if (url.startsWith('@')) {
    const handle = url.replace(/^@+/, '').trim();
    if (!handle || !/^[a-zA-Z0-9_]{1,50}$/.test(handle)) {
      return {
        isValid: false,
        normalizedUrl: '',
        displayDomain: '',
        error: 'Invalid handle. Handles should contain only letters, numbers, and underscores.',
      };
    }

    return {
      isValid: true,
      normalizedUrl: `https://x.com/${handle}`,
      displayDomain: `@${handle}`,
    };
  }

  // Prepend https:// if protocol is missing
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { isValid: false, normalizedUrl: '', displayDomain: '', error: 'URL must use HTTP or HTTPS protocol.' };
    }

    const hostname = parsed.hostname.toLowerCase();
    // Check if hostname has a valid dot (e.g. domain.com)
    if (!hostname.includes('.') || hostname.endsWith('.')) {
      return { isValid: false, normalizedUrl: '', displayDomain: '', error: 'Please enter a valid domain name or @handle.' };
    }

    // Safety and compliance check
    const safetyCheck = checkDestinationSafety(url, hostname);
    if (!safetyCheck.isSafe) {
      return { isValid: false, normalizedUrl: '', displayDomain: '', error: safetyCheck.reason };
    }

    // Strip tracking parameters (utm_*, ref, affiliate, etc.)
    const searchParams = new URLSearchParams(parsed.search);
    const keysToDelete: string[] = [];
    searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (TRACKING_QUERY_PARAMS.has(lowerKey) || lowerKey.startsWith('utm_')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => searchParams.delete(key));
    parsed.search = searchParams.toString();

    // Canonical display domain (strip www.)
    const displayDomain =
      hostname.replace(/^www\./i, '') + (parsed.pathname !== '/' && parsed.pathname !== '' ? parsed.pathname : '');

    return {
      isValid: true,
      normalizedUrl: parsed.toString(),
      displayDomain,
    };
  } catch {
    return { isValid: false, normalizedUrl: '', displayDomain: '', error: 'Invalid URL format.' };
  }
}

/**
 * Returns Google Favicon URL for a given domain
 */
export function getFaviconUrl(url: string, size: number = 64): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=${size}`;
  } catch {
    return '';
  }
}
