/**
 * Shared image utility functions for OnlyExplore.
 * Optimized for high-performance rendering and resilient fallbacks.
 * Supports Unsplash, Pexels, and Cloudinary image URLs.
 */

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop";

const CURATED_FALLBACKS = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1000&auto=format&fit=crop"
];

/**
 * Validates and sanitizes image URLs.
 * Detects broken or generic placeholder URLs and provides a safe fallback.
 * Optimizes Unsplash, Pexels, and Cloudinary URLs with CDN params.
 */
export function safeImageResolver(url: string | null | undefined, fallbackQuery?: string, heroImage?: string): string {
  if (!url || 
      url.includes('placeholder') || 
      url.includes('placehold.co') ||
      url.includes('source.unsplash.com') ||
      url.includes('loremflickr.com') ||
      url.length < 15) {
    
    if (heroImage && !heroImage.includes('placeholder') && !heroImage.includes('placehold.co')) {
      return optimizeImageUrl(heroImage, 800);
    }

    return CURATED_FALLBACKS[Math.floor(Math.random() * CURATED_FALLBACKS.length)];
  }
  
  // Optimize URLs from all supported CDNs
  return optimizeImageUrl(url, 800);
}

/**
 * Optimizes image URLs from any supported CDN.
 * Unsplash: Appends auto-format, WebP, quality, and width params.
 * Cloudinary: Injects transformation params into URL path.
 * Pexels: Already optimized by their API.
 */
export function optimizeImageUrl(url: string, width = 800, quality = 80): string {
  if (!url) return FALLBACK_IMAGE;

  // Unsplash optimization
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&q=${quality}&w=${width}`;
  }
  
  // Cloudinary optimization
  if (url.includes('res.cloudinary.com') && !url.includes(`w_${width}`)) {
    return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
  }

  // Pexels images are pre-optimized
  if (url.includes('images.pexels.com')) {
    return url;
  }

  return url;
}

/**
 * Backwards-compatible alias for optimizeImageUrl.
 */
export function optimizeUnsplashUrl(url: string, width = 800, quality = 80): string {
  return optimizeImageUrl(url, width, quality);
}

/**
 * Generates an optimized URL for a specific size variant.
 */
export function getImageUrl(url: string, variant: 'hero' | 'card' | 'thumb' = 'card'): string {
  const widthMap = { hero: 1600, card: 800, thumb: 400 };
  const qualityMap = { hero: 85, card: 80, thumb: 75 };
  
  return optimizeImageUrl(url, widthMap[variant], qualityMap[variant]);
}

/**
 * Generates an optimized URL with specific dimensions and quality settings.
 * @deprecated Use optimizeImageUrl or getImageUrl instead
 */
export function getOptimizedUrl(url: string, width = 800, quality = 80): string {
  return optimizeImageUrl(url, width, quality);
}

/**
 * Tiny base64 blur placeholder for use with next/image.
 */
export const BLUR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWExYTJlIiBzdG9wLW9wYWNpdHk9IjAuNCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzE2MjEzZSIgc3RvcC1vcGFjaXR5PSIwLjQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==';
