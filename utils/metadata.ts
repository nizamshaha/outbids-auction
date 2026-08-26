import { sanitizeAndNormalizeUrl, getFaviconUrl } from './formatters';

export interface ScrapedMetadata {
  title: string;
  description: string;
  iconUrl: string;
  domain: string;
}

/**
 * Clean and decode HTML entities and whitespace
 */
function cleanText(rawText: string, maxLength: number = 200): string {
  if (!rawText) return '';
  return rawText
    .replace(/<[^>]*>/g, '') // remove tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/**
 * Scrapes metadata (Title, Description, Favicon) with safe timeout and fallback
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OutbidsBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return fallback;
    }

    const html = await response.text();

    // 1. Extract Title
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

    // 2. Extract Description
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

    // 3. Extract Favicon / Touch Icon
    let iconUrl = fallbackFavicon;
    const appleTouchIconMatch = html.match(/<link\s+[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
    const iconMatch = html.match(/<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["']/i);

    const rawIcon = appleTouchIconMatch?.[1] || iconMatch?.[1];
    if (rawIcon) {
      if (rawIcon.startsWith('http://') || rawIcon.startsWith('https://')) {
        iconUrl = rawIcon;
      } else if (rawIcon.startsWith('//')) {
        iconUrl = `https:${rawIcon}`;
      } else if (rawIcon.startsWith('/')) {
        try {
          const parsed = new URL(normalizedUrl);
          iconUrl = `${parsed.origin}${rawIcon}`;
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
