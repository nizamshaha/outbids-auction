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

/**
 * Normalizes and validates a URL string or social @handle.
 * Automatically converts @handle to https://x.com/handle.
 * Automatically prefixes with https:// if no protocol is given.
 */
export function sanitizeAndNormalizeUrl(rawUrl: string): {
  isValid: boolean;
  normalizedUrl: string;
  displayDomain: string;
  error?: string;
} {
  let url = rawUrl.trim();
  if (!url) {
    return { isValid: false, normalizedUrl: '', displayDomain: '', error: 'URL or @handle is required.' };
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

    const hostname = parsed.hostname;
    // Check if hostname has a valid dot (e.g. domain.com)
    if (!hostname.includes('.') || hostname.endsWith('.')) {
      return { isValid: false, normalizedUrl: '', displayDomain: '', error: 'Please enter a valid domain name or @handle.' };
    }

    // Clean display domain (strip www.)
    const displayDomain = hostname.replace(/^www\./i, '') + (parsed.pathname !== '/' ? parsed.pathname : '');

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
