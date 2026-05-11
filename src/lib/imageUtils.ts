/**
 * Shared image utility functions for OnlyExplore.
 * Optimized for high-performance rendering and resilient fallbacks.
 */

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop";

/**
 * Validates and sanitizes image URLs.
 * Detects broken or generic placeholder URLs and provides a safe fallback.
 */
export function safeImageResolver(url: string | null | undefined, fallbackQuery?: string, heroImage?: string): string {
  if (!url || 
      url.includes('placeholder') || 
      url.includes('source.unsplash.com') ||
      url === FALLBACK_IMAGE ||
      url.length < 15) {
    
    if (heroImage && !heroImage.includes('placeholder')) {
      return heroImage;
    }

    if (fallbackQuery) {
      return `https://images.unsplash.com/featured/?${encodeURIComponent(fallbackQuery)},travel,photography`;
    }
    return FALLBACK_IMAGE;
  }
  
  return url;
}

/**
 * Generates an optimized Unsplash URL with specific dimensions and quality settings.
 */
export function getOptimizedUrl(url: string, width = 800, quality = 80): string {
  if (!url.includes('unsplash.com')) return url;
  
  // Strip existing params and add new ones
  const baseUrl = url.split('?')[0];
  return `${baseUrl}?auto=format&fit=crop&q=${quality}&w=${width}`;
}
