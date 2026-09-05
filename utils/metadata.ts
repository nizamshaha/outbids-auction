import dns from 'dns';
import { sanitizeAndNormalizeUrl, getFaviconUrl } from './formatters';

export interface ScrapedMetadata {
  title: string;
  description: string;
  iconUrl: string;
  domain: string;
}

/**
 * Clean and decode HTML entities, remove control characters, and limit length
 */
function cleanText(rawText: string, maxLength: number = 200): string {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates whether an IPv4/IPv6 address string is a safe public routable internet address.
 * Rejects RFC1918, Loopback, Link-Local, Cloud Metadata, Multicast, and Reserved IPs.
 */
export function isPublicIpAddress(ip: string): boolean {
  if (!ip || typeof ip !== 'string') return false;
  let cleanIp = ip.trim().toLowerCase().replace(/^\[|\]$/g, '');

  // Handle IPv4-mapped IPv6 addresses (e.g., ::ffff:127.0.0.1 or ::ffff:7f00:1)
  if (cleanIp.startsWith('::ffff:')) {
    const v4Part = cleanIp.slice(7);
    if (v4Part.includes('.')) {
      return isPublicIpAddress(v4Part);
    }
    // Hex IPv4 in IPv6 (e.g. ::ffff:7f00:0001)
    const hexParts = v4Part.split(':');
    if (hexParts.length === 2) {
      try {
        const high = parseInt(hexParts[0], 16);
        const low = parseInt(hexParts[1], 16);
        const o1 = (high >> 8) & 0xff;
        const o2 = high & 0xff;
        const o3 = (low >> 8) & 0xff;
        const o4 = low & 0xff;
        return isPublicIpAddress(`${o1}.${o2}.${o3}.${o4}`);
      } catch {
        return false;
      }
    }
    return false;
  }

  // IPv6 Checks
  if (cleanIp.includes(':')) {
    if (
      cleanIp === '::1' ||
      cleanIp === '::' ||
      cleanIp.startsWith('fe80:') || // Link-local
      cleanIp.startsWith('fc00:') || // Unique local
      cleanIp.startsWith('fd00:') ||
      cleanIp.startsWith('ff00:') || // Multicast
      cleanIp.startsWith('2001:db8:') || // RFC 3849 Documentation
      cleanIp.startsWith('2002:')    // 6to4 relay
    ) {
      return false;
    }
    return true;
  }

  // IPv4 Checks
  const parts = cleanIp.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [o1, o2, o3] = parts;

  if (o1 === 0) return false;                            // 0.0.0.0/8 Current network
  if (o1 === 127) return false;                          // 127.0.0.0/8 Loopback
  if (o1 === 10) return false;                           // 10.0.0.0/8 Private
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return false;  // 172.16.0.0/12 Private
  if (o1 === 192 && o2 === 168) return false;            // 192.168.0.0/16 Private
  if (o1 === 169 && o2 === 254) return false;            // 169.254.0.0/16 Link-Local / Cloud Metadata
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return false; // 100.64.0.0/10 CGNAT
  if (o1 === 192 && o2 === 0 && o3 === 2) return false;  // 192.0.2.0/24 Documentation (TEST-NET-1)
  if (o1 === 198 && o2 === 51 && o3 === 100) return false; // 198.51.100.0/24 Documentation (TEST-NET-2)
  if (o1 === 198 && (o2 === 18 || o2 === 19)) return false; // 198.18.0.0/15 Benchmark testing
  if (o1 === 203 && o2 === 0 && o3 === 113) return false; // 203.0.113.0/24 Documentation (TEST-NET-3)
  if (o1 >= 224 && o1 <= 239) return false;              // 224.0.0.0/4 Multicast
  if (o1 >= 240) return false;                           // 240.0.0.0/4 Reserved / Broadcast

  return true;
}

/**
 * Validates whether a target URL is safe from SSRF (Server-Side Request Forgery).
 * Performs syntactic checks, port whitelist, and IP address validation.
 */
export function isSafePublicUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);

    // 1. Protocol must be http or https only
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // 2. Port must be standard web ports only (80, 443, or default)
    if (parsed.port && !['80', '443', '8080', '8443'].includes(parsed.port)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase().trim();

    // 3. Block localhost, internal hostnames, and cloud metadata services
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.corp') ||
      hostname.endsWith('.lan') ||
      hostname.endsWith('.home') ||
      hostname.endsWith('.test') ||
      hostname.endsWith('.example') ||
      hostname.endsWith('.invalid') ||
      hostname === 'metadata.google.internal' ||
      hostname === 'instance-data'
    ) {
      return false;
    }

    // 4. Block numeric IP representations, octal, hex bypasses
    if (/^(0x[0-9a-f]+|\d+)$/i.test(hostname) || /^0[0-7]+(\.0[0-7]+)*$/i.test(hostname)) {
      return false;
    }

    // 5. If hostname is a raw IPv4/IPv6 literal (including bracketed IPv6)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':') || hostname.startsWith('[')) {
      return isPublicIpAddress(hostname);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves hostname to IP address and validates public routability to prevent DNS Rebinding
 */
export async function resolveAndValidateDns(hostname: string): Promise<boolean> {
  try {
    const cleanHost = hostname.replace(/^\[|\]$/g, '');
    const records = await dns.promises.lookup(cleanHost, { all: true });
    if (!records || records.length === 0) return false;

    for (const record of records) {
      if (!isPublicIpAddress(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Scrapes metadata (Title, Description, Favicon) with comprehensive SSRF protection,
 * memory-bounded response streaming, strict timeouts, and XSS sanitization.
 */
export async function scrapeUrlMetadata(targetUrl: string, redirectCount: number = 0): Promise<ScrapedMetadata> {
  const { displayDomain, normalizedUrl } = sanitizeAndNormalizeUrl(targetUrl);
  const fallbackFavicon = getFaviconUrl(normalizedUrl, 128);

  const fallback: ScrapedMetadata = {
    title: displayDomain,
    description: `Official website of ${displayDomain}. Explore products, tools, and services.`,
    iconUrl: fallbackFavicon,
    domain: displayDomain,
  };

  if (!normalizedUrl || normalizedUrl === 'https://' || redirectCount > 3) {
    return fallback;
  }

  // 1. Syntactic SSRF Check
  if (!isSafePublicUrl(normalizedUrl)) {
    console.warn(`[SSRF Prevention] Blocked scraping request to non-public target: ${normalizedUrl}`);
    return fallback;
  }

  // 2. DNS Resolution Rebinding Check
  try {
    const parsed = new URL(normalizedUrl);
    const isDnsSafe = await resolveAndValidateDns(parsed.hostname);
    if (!isDnsSafe) {
      console.warn(`[SSRF Prevention] DNS resolved to non-public IP for: ${parsed.hostname}`);
      return fallback;
    }
  } catch {
    return fallback;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s strict timeout

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 OutbidsBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'manual',
    });

    clearTimeout(timeoutId);

    // If redirected, re-validate redirect target safely (bounded to 3 hops)
    if (response.status >= 300 && response.status < 400 && redirectCount < 3) {
      const location = response.headers.get('location');
      if (location) {
        let redirectUrl = location;
        if (!location.startsWith('http')) {
          redirectUrl = new URL(location, normalizedUrl).toString();
        }
        if (isSafePublicUrl(redirectUrl)) {
          const redirectHost = new URL(redirectUrl).hostname;
          if (await resolveAndValidateDns(redirectHost)) {
            return scrapeUrlMetadata(redirectUrl, redirectCount + 1);
          }
        }
      }
      return fallback;
    }

    if (!response.ok) {
      return fallback;
    }

    // 3. Content-Type Gate: Only process HTML responses
    const contentType = response.headers.get('content-type') || '';
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml+xml') &&
      !contentType.includes('application/xml')
    ) {
      return fallback;
    }

    // 4. Memory-bounded body reader (max 256KB)
    const maxBytes = 256 * 1024;
    let html = '';

    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let bytesRead = 0;

      while (bytesRead < maxBytes) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          bytesRead += value.length;
          html += decoder.decode(value, { stream: true });
        }
      }
      try {
        await reader.cancel();
      } catch {}
    } else {
      const fullText = await response.text();
      html = fullText.slice(0, maxBytes);
    }

    // 5. Extract Title
    let title = '';
    const ogTitleMatch = html.match(/<meta\s+[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const metaTitleMatch = html.match(/<meta\s+[^>]*name=["']title["'][^>]*content=["']([^"']+)["']/i);
    const standardTitleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    if (ogTitleMatch && ogTitleMatch[1]) {
      title = cleanText(ogTitleMatch[1], 100);
    } else if (metaTitleMatch && metaTitleMatch[1]) {
      title = cleanText(metaTitleMatch[1], 100);
    } else if (standardTitleMatch && standardTitleMatch[1]) {
      title = cleanText(standardTitleMatch[1], 100);
    }

    // 6. Extract Description
    let description = '';
    const ogDescMatch = html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const twitterDescMatch = html.match(/<meta\s+[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);

    if (ogDescMatch && ogDescMatch[1]) {
      description = cleanText(ogDescMatch[1], 180);
    } else if (metaDescMatch && metaDescMatch[1]) {
      description = cleanText(metaDescMatch[1], 180);
    } else if (twitterDescMatch && twitterDescMatch[1]) {
      description = cleanText(twitterDescMatch[1], 180);
    }

    // 7. Extract Favicon / Touch Icon
    let iconUrl = fallbackFavicon;
    const appleTouchIconMatch = html.match(/<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
    const iconMatch = html.match(/<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["']/i);

    const rawIcon = appleTouchIconMatch?.[1] || iconMatch?.[1];
    if (rawIcon && typeof rawIcon === 'string') {
      const sanitizedRawIcon = rawIcon.trim();
      if (sanitizedRawIcon.startsWith('http://') || sanitizedRawIcon.startsWith('https://')) {
        if (isSafePublicUrl(sanitizedRawIcon)) {
          iconUrl = sanitizedRawIcon;
        }
      } else if (sanitizedRawIcon.startsWith('//')) {
        const candidate = `https:${sanitizedRawIcon}`;
        if (isSafePublicUrl(candidate)) {
          iconUrl = candidate;
        }
      } else if (sanitizedRawIcon.startsWith('/')) {
        try {
          const parsedOrigin = new URL(normalizedUrl).origin;
          const candidate = `${parsedOrigin}${sanitizedRawIcon}`;
          if (isSafePublicUrl(candidate)) {
            iconUrl = candidate;
          }
        } catch {
          iconUrl = fallbackFavicon;
        }
      }
    }

    return {
      title: title || displayDomain,
      description: description || fallback.description,
      iconUrl: iconUrl || fallbackFavicon,
      domain: displayDomain,
    };
  } catch (err) {
    return fallback;
  }
}
