/**
 * Utility functions for parsing and rendering videos.
 */

export const getEmbedVideoUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('data:')) return url; // base64 data URL

  // YouTube matchers
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // Vimeo matchers
  const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url; // Direct MP4 or other link
};

export const isEmbedVideo = (url: string): boolean => {
  if (!url) return false;
  const embedUrl = getEmbedVideoUrl(url);
  return embedUrl.includes('youtube.com/embed') || embedUrl.includes('player.vimeo.com/video');
};

export const isDataVideo = (url: string): boolean => {
  if (!url) return false;
  return url.startsWith('data:video/') || url.startsWith('blob:');
};
