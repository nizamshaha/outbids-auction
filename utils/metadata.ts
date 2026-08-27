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
    .replace(/<[^>]*>/g, '') // remove HTML tags
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // strip control chars
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
 * Validates whether a target URL is safe from SSRF (Server-Side Request Forgery).
 * Blocks loopback, private IPv4/IPv6 subnets, link-local, cloud metadata IP, and non-standard web ports.
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
      hostname === 'metadata.google.internal' ||
      hostname === 'instance-data'
    ) {
      return false;
    }

    // 4. Block IPv6 loopback and private/link-local
    if (
      hostname.includes(':') ||
      hostname.startsWith('[') ||
      hostname === '::1' ||
      hostname.startsWith('fe80:') ||
      hostname.startsWith('fc00:') ||
      hostname.startsWith('fd00:')
    ) {
      return false;
    }

    // 5. Block numeric representations and private/reserved IPv4 addresses
    // Check if hostname is an IPv4 address
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);

    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);
      const octet3 = parseInt(ipMatch[3], 10);
      const octet4 = parseInt(ipMatch[4], 10);

      if (
        octet1 > 255 ||
        octet2 > 255 ||
        octet3 > 255 ||
        octet4 > 255
      ) {
        return false;
      }

      // Loopback: 127.0.0.0/8
      if (octet1 === 127) return false;

      // Current network: 0.0.0.0/8
      if (octet1 === 0) return false;

      // Private Network: 10.0.0.0/8
      if (octet1 === 10) return false;

      // Private Network: 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) return false;

      // Private Network: 192.168.0.0/16
      if (octet1 === 192 && octet2 === 168) return false;

      // Cloud Metadata & Link-Local: 169.254.0.0/16 (e.g., AWS/GCP 169.254.169.254)
      if (octet1 === 169 && octet2 === 254) return false;

      // CGNAT: 100.64.0.0/10 (100.64.0.0 - 100.127.255.255)
      if (octet1 === 100 && octet2 >= 64 && octet2 <= 127) return false;

      // Multicast: 224.0.0.0/4 (224.0.0.0 - 239.255.255.255)
      if (octet1 >= 224 && octet1 <= 239) return false;

      // Reserved / Broadcast: 240.0.0.0/4, 255.255.255.255
      if (octet1 >= 240) return false;
    }

    // Check for octal, decimal, or hex IP representation bypasses (e.g. 0177.0.0.1, 2130706433, 0x7f000001)
    if (/^(0x[0-9a-f]+|\d+)$/i.test(hostname) || /^0[0-7]+(\.0[0-7]+)*$/i.test(hostname)) {
      return false;
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
export async function scrapeUrlMetadata(targetUrl: string): Promise<ScrapedMetadata> {
  const { displayDomain, normalizedUrl } = sanitizeAndNormalizeUrl(targetUrl);
  const fallbackFavicon = getFaviconUrl(normalizedUrl, 128);

  const fallback: ScrapedMetadata = {
    title: displayDomain,
    description: `Official website of ${displayDomain}. Explore products, tools, and services.`,
    iconUrl: fallbackFavicon,
    domain: displayDomain,
  };

  if (!normalizedUrl || normalizedUrl === 'https://') {
    return fallback;
  }

  // 1. SSRF Gate: Verify the target URL does not resolve to internal or metadata infrastructure
  if (!isSafePublicUrl(normalizedUrl)) {
    console.warn(`[SSRF Prevention] Blocked scraping request to non-public target: ${normalizedUrl}`);
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
    });

    clearTimeout(timeoutId);

    // 2. Validate Response
    if (!response.ok) {
      return fallback;
    }

    // 3. Content-Type Gate: Only process HTML responses (prevents processing raw binaries or internal APIs)
    const contentType = response.headers.get('content-type') || '';
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml+xml') &&
      !contentType.includes('application/xml')
    ) {
      return fallback;
    }

    // 4. Memory-bounded body reader (max 256KB to avoid memory exhaustion / DoS)
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

    // 7. Extract Favicon / Touch Icon with XSS & Schema validation
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
    // Network / timeout error fallback
    return fallback;
  }
}
