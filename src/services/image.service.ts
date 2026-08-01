import { v2 as cloudinary } from 'cloudinary';
import { cacheService } from './cache.service';
import { PexelsService } from './pexels.service';
import PlaceImages from '@/models/PlaceImages';
import { connectDB } from '@/lib/mongodb';

// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary CDN Initialization
// ─────────────────────────────────────────────────────────────────────────────
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

let isCloudinaryConfigured = false;
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  isCloudinaryConfigured = true;
  console.log('✅ Cloudinary initialized for image optimization pipeline.');
} else if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL
  });
  isCloudinaryConfigured = true;
  console.log('✅ Cloudinary initialized via CLOUDINARY_URL.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Curated Fallbacks (Emergency: zero API keys)
// ─────────────────────────────────────────────────────────────────────────────
const CURATED_FALLBACKS: Record<string, string[]> = {
  'manali': [
    'https://images.unsplash.com/photo-1591266128243-e4a67f6002c1?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1605146768851-eda79da39897?auto=format&fit=crop&q=80&w=800',
  ],
  'goa': [
    'https://images.unsplash.com/photo-1512789172734-7b099dbd15a6?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?auto=format&fit=crop&q=80&w=800',
  ],
  'rishikesh': [
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1563205096-7c9f80998f4c?auto=format&fit=crop&q=80&w=800',
  ],
  'shimla': [
    'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&q=80&w=800',
  ],
  'jaipur': [
    'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=800',
  ],
  'udaipur': [
    'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800',
  ],
  'delhi': [
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=800',
  ],
  'mumbai': [
    'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80&w=800',
  ],
  'varanasi': [
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=800',
  ],
  'kerala': [
    'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=800',
  ],
};

const GENERAL_FALLBACKS = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=800&auto=format&fit=crop",
];

// ─────────────────────────────────────────────────────────────────────────────
// Rate limit tracker for Unsplash (50 req/hr free tier)
// ─────────────────────────────────────────────────────────────────────────────
let unsplashRateLimitRemaining = 50;
let unsplashRateLimitReset = 0;

function isUnsplashRateLimited(): boolean {
  return unsplashRateLimitRemaining <= 3 && Date.now() < unsplashRateLimitReset;
}

// ─────────────────────────────────────────────────────────────────────────────
// Image Service
// ─────────────────────────────────────────────────────────────────────────────
export class ImageService {
  /**
   * Upload an image URL to Cloudinary CDN and return the optimized URL.
   * Gracefully returns the original (optimized) URL if Cloudinary is not configured.
   */
  static async uploadCDN(url: string, publicId: string): Promise<string> {
    if (!isCloudinaryConfigured) {
      return this.optimizeImageUrl(url);
    }
    try {
      const uploadRes = await cloudinary.uploader.upload(url, {
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        resource_type: 'image',
        timeout: 10000, // 10 second timeout
      });
      return uploadRes.secure_url;
    } catch (err) {
      console.warn(`[ImageService] Cloudinary upload failed for "${publicId}":`, (err as any)?.message || err);
      return this.optimizeImageUrl(url);
    }
  }

  /**
   * Optimize any image URL with CDN-native parameters.
   * Supports Unsplash, Pexels, and Cloudinary URLs.
   */
  static optimizeImageUrl(url: string, width = 800, quality = 80): string {
    if (!url) return this.getCuratedFallback('travel');

    // Unsplash optimization
    if (url.includes('unsplash.com')) {
      const baseUrl = url.split('?')[0];
      return `${baseUrl}?auto=format&fit=crop&q=${quality}&w=${width}&fm=webp`;
    }

    // Pexels optimization (already optimized via src.landscape)
    if (url.includes('images.pexels.com')) {
      return url;
    }

    // Cloudinary optimization
    if (url.includes('res.cloudinary.com')) {
      return url.replace('/upload/', `/upload/w_${width},q_${quality},f_auto/`);
    }

    return url;
  }

  /**
   * Backwards-compatible alias
   */
  static optimizeUnsplashUrl(url: string, width = 800, quality = 80): string {
    return this.optimizeImageUrl(url, width, quality);
  }

  /**
   * Generates a contextual image query.
   */
  static generateContextualQuery(params: {
    destination: string;
    name?: string;
    category: 'landmark' | 'activity' | 'stay' | 'cafe' | 'nature' | 'hero';
  }): string {
    const { destination, name, category } = params;
    const categoryModifiers: Record<string, string> = {
      hero: 'landscape',
      landmark: 'landmark',
      activity: 'adventure',
      stay: 'hotel',
      cafe: 'cafe',
      nature: 'nature'
    };

    const modifier = categoryModifiers[category] || '';
    if (name) {
      return `${name} ${destination}`.trim();
    }
    return `${destination} ${modifier}`.trim();
  }

  /**
   * Fetch images from Unsplash API with error handling and rate-limit awareness.
   * Returns null if rate-limited, errored, or no results.
   */
  private static async fetchFromUnsplash(query: string, perPage = 5): Promise<any[] | null> {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';
    if (!accessKey) {
      console.warn('[ImageService] UNSPLASH_ACCESS_KEY is not set. Skipping Unsplash.');
      return null;
    }

    if (isUnsplashRateLimited()) {
      console.warn(`[ImageService] Unsplash rate limited. ${unsplashRateLimitRemaining} requests remaining. Resets at ${new Date(unsplashRateLimitReset).toISOString()}`);
      return null;
    }

    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&client_id=${accessKey}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      // Track rate limits from response headers
      const remaining = res.headers.get('X-Ratelimit-Remaining');
      const reset = res.headers.get('X-Ratelimit-Reset'); // Unix timestamp
      if (remaining) unsplashRateLimitRemaining = parseInt(remaining, 10);
      if (reset) unsplashRateLimitReset = parseInt(reset, 10) * 1000;

      if (res.status === 401) {
        console.error('[ImageService] Unsplash 401 — Invalid or missing API key!');
        return null;
      }
      if (res.status === 403) {
        console.error('[ImageService] Unsplash 403 — Access forbidden. Check API key permissions.');
        return null;
      }
      if (res.status === 429) {
        console.warn('[ImageService] Unsplash 429 — Rate limited!');
        unsplashRateLimitRemaining = 0;
        return null;
      }
      if (!res.ok) {
        console.warn(`[ImageService] Unsplash ${res.status} for query "${query}"`);
        return null;
      }

      const data = await res.json();
      return data.results && data.results.length > 0 ? data.results : null;
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        console.warn('[ImageService] Unsplash request timed out for:', query);
      } else {
        console.warn('[ImageService] Unsplash fetch error:', err?.message || err);
      }
      return null;
    }
  }

  /**
   * Multi-provider image fetch pipeline:
   * 1. Redis/Memory Cache
   * 2. MongoDB Cache
   * 3. Unsplash API
   * 4. Pexels API (fallback)
   * 5. Curated hardcoded fallbacks
   */
  static async fetchPremiumImage(query: string, options: { 
    cacheKey?: string, 
    fallbackQuery?: string,
    forceFresh?: boolean 
  } = {}): Promise<string> {
    const cacheKey = options.cacheKey ? `img:${options.cacheKey.toLowerCase().trim()}` : `img:${query.toLowerCase().trim()}`;
    
    // ── 1. Check Cache ────────────────────────────────────────────────────
    if (!options.forceFresh) {
      try {
        const cached = await cacheService.get<string>(cacheKey);
        if (cached) return cached;
      } catch {
        // Cache read failed, continue to API
      }
    }

    // ── 2. Try Unsplash ──────────────────────────────────────────────────
    let imageUrl: string | null = null;

    const unsplashResults = await this.fetchFromUnsplash(query);
    if (unsplashResults && unsplashResults.length > 0) {
      imageUrl = unsplashResults[0].urls.regular;
    } else if (options.fallbackQuery) {
      const fallbackResults = await this.fetchFromUnsplash(options.fallbackQuery);
      if (fallbackResults && fallbackResults.length > 0) {
        imageUrl = fallbackResults[0].urls.regular;
      }
    }

    // ── 3. Try Pexels (fallback) ─────────────────────────────────────────
    if (!imageUrl && PexelsService.isAvailable()) {
      console.log(`[ImageService] Trying Pexels fallback for: "${query}"`);
      const pexelsUrl = await PexelsService.fetchSinglePhoto(query);
      if (pexelsUrl) imageUrl = pexelsUrl;
      
      if (!imageUrl && options.fallbackQuery) {
        const pexelsFallback = await PexelsService.fetchSinglePhoto(options.fallbackQuery);
        if (pexelsFallback) imageUrl = pexelsFallback;
      }
    }

    // ── 4. Process and cache the result ──────────────────────────────────
    if (imageUrl) {
      const cleanName = query.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 50);
      const publicId = `onlyexplore/${cleanName}`;
      
      // Try CDN upload (non-blocking if it fails)
      const optimizedUrl = await this.uploadCDN(imageUrl, publicId);

      // Cache optimized URL for 30 days
      cacheService.set(cacheKey, optimizedUrl, 30 * 24 * 60 * 60).catch(() => {});

      // Save to MongoDB PlaceImages model asynchronously (fire-and-forget)
      this.saveToPlaceImagesDB(cacheKey, query, imageUrl).catch(() => {});

      return optimizedUrl;
    }

    // ── 5. Emergency fallback ────────────────────────────────────────────
    const emergency = this.getCuratedFallback(query);
    return this.optimizeImageUrl(emergency);
  }

  /**
   * Fetch multiple images for a query in bulk.
   * Uses the same multi-provider fallback chain.
   */
  static async fetchBulkPremiumImages(query: string, count = 15): Promise<string[]> {
    const cacheKey = `imgbulk:${query.toLowerCase().trim()}:${count}`;
    
    // Check cache
    try {
      const cached = await cacheService.get<string[]>(cacheKey);
      if (cached && cached.length > 0) return cached;
    } catch {
      // Continue
    }

    let urls: string[] = [];

    // Try Unsplash
    const unsplashResults = await this.fetchFromUnsplash(query, count);
    if (unsplashResults && unsplashResults.length > 0) {
      urls = await Promise.all(unsplashResults.map(async (r: any, idx: number) => {
        const cleanName = `${query.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 40)}_${idx}`;
        const publicId = `onlyexplore/${cleanName}`;
        return this.uploadCDN(r.urls.regular, publicId);
      }));
    }

    // If Unsplash failed or returned too few, try Pexels
    if (urls.length < Math.min(count, 3) && PexelsService.isAvailable()) {
      console.log(`[ImageService] Pexels bulk fallback for: "${query}" (need ${count}, have ${urls.length})`);
      const pexelsUrls = await PexelsService.fetchBulkPhotos(query, count - urls.length);
      urls = [...urls, ...pexelsUrls];
    }

    // If we still have nothing, use curated fallbacks
    if (urls.length === 0) {
      const fb = this.getCuratedFallback(query);
      urls = Array(count).fill(this.optimizeImageUrl(fb));
    }

    // Pad to requested count if needed
    while (urls.length < count && urls.length > 0) {
      urls.push(urls[urls.length % urls.length === 0 ? 0 : urls.length - 1]);
    }

    // Cache for 30 days
    if (urls.length > 0) {
      cacheService.set(cacheKey, urls, 30 * 24 * 60 * 60).catch(() => {});
    }

    return urls;
  }

  /**
   * Save image data to MongoDB PlaceImages collection (fire-and-forget).
   */
  private static async saveToPlaceImagesDB(cacheKey: string, query: string, imageUrl: string): Promise<void> {
    try {
      await connectDB();
      await PlaceImages.findOneAndUpdate(
        { placeKey: cacheKey },
        { 
          placeName: query, 
          cityName: query.split(' ').pop() || '', 
          images: [imageUrl], 
          lastFetched: new Date() 
        },
        { upsert: true }
      );
    } catch (err) {
      console.error("[ImageService] PlaceImages DB save error:", (err as any)?.message || err);
    }
  }

  /**
   * Returns a curated fallback URL for emergency use.
   * Matches against destination keywords, falls back to generic travel photos.
   */
  static getCuratedFallback(query: string): string {
    const q = query.toLowerCase();
    for (const [dest, images] of Object.entries(CURATED_FALLBACKS)) {
      if (q.includes(dest)) {
        return images[Math.floor(Math.random() * images.length)];
      }
    }
    return GENERAL_FALLBACKS[Math.floor(Math.random() * GENERAL_FALLBACKS.length)];
  }
}
export default ImageService;
