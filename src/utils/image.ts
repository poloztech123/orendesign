export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

/**
 * Formats image URLs safely so they render reliably on local dev, Cloud Run, and GitHub Pages subpaths.
 */
export function formatImageUrl(url?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return DEFAULT_FALLBACK_IMAGE;
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
    return [DEFAULT_FALLBACK_IMAGE];
  }
  return urls.map((u) => formatImageUrl(u));
}
