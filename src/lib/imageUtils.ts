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
      url.length < 15) {
    
    if (heroImage && !heroImage.includes('placeholder')) {
      return heroImage;
    }

    const fallbacks = [
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1000&auto=format&fit=crop"
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
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
