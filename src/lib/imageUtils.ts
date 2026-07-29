/**
 * Shared image utility functions for OnlyExplore.
 * Optimized for high-performance rendering and resilient fallbacks.
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
 * Always appends WebP/auto-format params to Unsplash URLs.
 */
export function safeImageResolver(url: string | null | undefined, fallbackQuery?: string, heroImage?: string): string {
  if (!url || 
      url.includes('placeholder') || 
      url.includes('placehold.co') ||
      url.includes('source.unsplash.com') ||
      url.includes('loremflickr.com') ||
      url.length < 15) {
    
    if (heroImage && !heroImage.includes('placeholder') && !heroImage.includes('placehold.co')) {
      return optimizeUnsplashUrl(heroImage, 800);
    }

    return CURATED_FALLBACKS[Math.floor(Math.random() * CURATED_FALLBACKS.length)];
  }
  
  // Optimize Unsplash URLs automatically
  return optimizeUnsplashUrl(url, 800);
}

/**
 * Optimizes an Unsplash URL with specific dimensions and quality settings.
 * Appends auto-format (WebP when supported), quality, and width params.
 */
export function optimizeUnsplashUrl(url: string, width = 800, quality = 80): string {
  if (!url.includes('unsplash.com')) return url;
  
  // Strip existing params and add optimized ones
  const baseUrl = url.split('?')[0];
  return `${baseUrl}?auto=format&fit=crop&q=${quality}&w=${width}`;
}

/**
 * Generates an optimized URL for a specific size variant.
 */
export function getImageUrl(url: string, variant: 'hero' | 'card' | 'thumb' = 'card'): string {
  const widthMap = { hero: 1600, card: 800, thumb: 400 };
  const qualityMap = { hero: 85, card: 80, thumb: 75 };
  
  return optimizeUnsplashUrl(url, widthMap[variant], qualityMap[variant]);
}

/**
 * Generates an optimized URL with specific dimensions and quality settings.
 * @deprecated Use optimizeUnsplashUrl or getImageUrl instead
 */
export function getOptimizedUrl(url: string, width = 800, quality = 80): string {
  return optimizeUnsplashUrl(url, width, quality);
}

/**
 * Tiny base64 blur placeholder for use with next/image.
 */
export const BLUR_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWExYTJlIiBzdG9wLW9wYWNpdHk9IjAuNCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzE2MjEzZSIgc3RvcC1vcGFjaXR5PSIwLjQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==';
