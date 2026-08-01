"use client";

/**
 * OptimizedImage — Production-grade image component for OnlyExplore
 * 
 * Features:
 * - Supports Unsplash, Pexels, and Cloudinary images through Next.js Image
 * - Blur placeholder during load
 * - Graceful error fallback with beautiful gradient placeholder
 * - Lazy loading by default (opt-in priority for hero images)
 * - CDN parameter optimization (WebP, auto-format)
 */

import { useState, useCallback, memo } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';

// Tiny transparent base64 SVG for blur placeholder
const BLUR_DATA_URL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMWExYTJlIiBzdG9wLW9wYWNpdHk9IjAuNCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzE2MjEzZSIgc3RvcC1vcGFjaXR5PSIwLjQiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==';

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=800&auto=format&fit=crop",
];

function getFallbackImage() {
  return FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
}

/**
 * Checks if a URL is from a known, whitelisted image CDN.
 */
function isKnownCDN(url: string): boolean {
  return (
    url.includes('unsplash.com') ||
    url.includes('images.pexels.com') ||
    url.includes('res.cloudinary.com')
  );
}

/**
 * Optimizes image URLs for performance.
 * Appends auto-format, WebP, and width params for supported CDNs.
 */
function optimizeUrl(url: string, width: number): string {
  if (!url) return getFallbackImage();

  // Unsplash optimization
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&q=80&w=${width}`;
  }

  // Cloudinary optimization
  if (url.includes('res.cloudinary.com') && !url.includes(`w_${width}`)) {
    return url.replace('/upload/', `/upload/w_${width},q_80,f_auto/`);
  }

  // Pexels images are already optimized via their API
  return url;
}

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  /** 'hero' = 1600px, 'card' = 800px, 'thumb' = 400px */
  variant?: 'hero' | 'card' | 'thumb';
  /** Show ImageOff icon on error instead of fallback image */
  showErrorIcon?: boolean;
  onLoad?: () => void;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = '',
  sizes,
  variant = 'card',
  showErrorIcon = false,
  onLoad,
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const targetWidth = variant === 'hero' ? 1600 : variant === 'thumb' ? 400 : 800;
  const optimizedSrc = optimizeUrl(src || '', targetWidth);

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
    }
  }, [hasError]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  // If error and showErrorIcon, render gradient placeholder
  if (hasError && showErrorIcon) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950 text-muted-foreground ${className}`}>
        <ImageOff className="w-8 h-8 opacity-20" />
      </div>
    );
  }

  const resolvedSrc = hasError ? getFallbackImage() : optimizedSrc;
  const defaultSizes = fill 
    ? sizes || '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
    : sizes;

  // Use next/image for all known CDN images (Unsplash, Pexels, Cloudinary)
  const isOptimizable = isKnownCDN(resolvedSrc);

  if (isOptimizable) {
    const imgProps: any = {
      src: resolvedSrc,
      alt,
      className: `transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`,
      loading: priority ? 'eager' : 'lazy',
      onError: handleError,
      onLoad: handleLoad,
      placeholder: 'blur' as const,
      blurDataURL: BLUR_DATA_URL,
      quality: 80,
    };

    if (fill) {
      imgProps.fill = true;
      imgProps.sizes = defaultSizes;
    } else {
      imgProps.width = width || targetWidth;
      imgProps.height = height || Math.round((width || targetWidth) * 0.625);
    }

    if (priority) {
      imgProps.priority = true;
    }

    return <Image {...imgProps} />;
  }

  // For non-CDN images, use regular img with lazy loading and gradient fallback on error
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-70'} ${className}`}
      loading={priority ? 'eager' : 'lazy'}
      onError={handleError}
      onLoad={handleLoad}
      width={fill ? undefined : (width || targetWidth)}
      height={fill ? undefined : (height || Math.round((width || targetWidth) * 0.625))}
    />
  );
});

export default OptimizedImage;
