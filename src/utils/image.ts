export const DEFAULT_FALLBACK_IMAGE = '';

/**
 * Formats image URLs safely so they render reliably on local dev, Cloud Run, and GitHub Pages subpaths.
 */
export function formatImageUrl(url?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '';
  }
  const trimmed = url.trim();

  // Data URLs, Blob URLs, or external HTTP/HTTPS links
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://')
  ) {
    return trimmed;
  }

  // Clean leading slash for relative uploads so it works both on root domain and GitHub Pages subpath (/orendesign/uploads/...)
  if (trimmed.startsWith('/uploads/')) {
    return trimmed.replace(/^\//, '');
  }

  return trimmed;
}

/**
 * Formats an array of image URLs safely
 */
export function formatImageUrls(urls?: string[]): string[] {
  if (!urls || !Array.isArray(urls) || urls.length === 0) {
    return [];
  }
  return urls.map((u) => formatImageUrl(u)).filter(Boolean);
}
