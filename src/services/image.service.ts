import { v2 as cloudinary } from 'cloudinary';
import { cacheService } from './cache.service';
import PlaceImages from '@/models/PlaceImages';
import { connectDB } from '@/lib/mongodb';

// Initialize Cloudinary
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

const CURATED_FALLBACKS: Record<string, string[]> = {
  'manali': [
    'https://images.unsplash.com/photo-1591266128243-e4a67f6002c1?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1605146768851-eda79da39897?auto=format&fit=crop&q=80',
  ],
  'goa': [
    'https://images.unsplash.com/photo-1512789172734-7b099dbd15a6?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?auto=format&fit=crop&q=80',
  ],
  'rishikesh': [
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1563205096-7c9f80998f4c?auto=format&fit=crop&q=80',
  ]
};

export class ImageService {
  /**
   * Upload an image URL to Cloudinary CDN and return the optimized URL
   */
  static async uploadCDN(url: string, publicId: string): Promise<string> {
    if (!isCloudinaryConfigured) {
      return this.optimizeUnsplashUrl(url);
    }
    try {
      const uploadRes = await cloudinary.uploader.upload(url, {
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        resource_type: 'image',
      });
      return uploadRes.secure_url;
    } catch (err) {
      console.warn(`[ImageService] Cloudinary upload failed for "${url}":`, err);
      return this.optimizeUnsplashUrl(url);
    }
  }

  /**
   * Optimize Unsplash URL natively via CDN parameters
   */
  static optimizeUnsplashUrl(url: string, width = 800, quality = 80): string {
    if (!url || !url.includes('unsplash.com')) return url;
    const baseUrl = url.split('?')[0];
    return `${baseUrl}?auto=format&fit=crop&q=${quality}&w=${width}&fm=webp`;
  }

  /**
   * Generates a contextual image query
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
   * Fetch a single premium image with caching
   */
  static async fetchPremiumImage(query: string, options: { 
    cacheKey?: string, 
    fallbackQuery?: string,
    forceFresh?: boolean 
  } = {}): Promise<string> {
    const cacheKey = options.cacheKey ? `img:${options.cacheKey.toLowerCase().trim()}` : `img:${query.toLowerCase().trim()}`;
    
    if (!options.forceFresh) {
      const cached = await cacheService.get<string>(cacheKey);
      if (cached) return cached;
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';
    if (!accessKey) {
      const fallback = this.getCuratedFallback(query);
      return this.optimizeUnsplashUrl(fallback);
    }

    const tryFetch = async (q: string) => {
      try {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=5&orientation=landscape&client_id=${accessKey}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.results && data.results.length > 0 ? data.results : null;
      } catch {
        return null;
      }
    };

    let results = await tryFetch(query);
    if (!results && options.fallbackQuery) {
      results = await tryFetch(options.fallbackQuery);
    }

    if (results && results.length > 0) {
      const originalUrl = results[0].urls.regular;
      const cleanName = query.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 50);
      const publicId = `onlyexplore/${cleanName}`;
      
      const optimizedUrl = await this.uploadCDN(originalUrl, publicId);

      // Cache optimized URL for 30 days
      await cacheService.set(cacheKey, optimizedUrl, 30 * 24 * 60 * 60);

      // Save to MongoDB PlaceImages model asynchronously
      connectDB().then(async () => {
        const images = results!.map((r: any) => r.urls.regular);
        await PlaceImages.findOneAndUpdate(
          { placeKey: cacheKey },
          { 
            placeName: query, 
            cityName: query.split(' ').pop() || '', 
            images, 
            lastFetched: new Date() 
          },
          { upsert: true }
        ).catch(err => console.error("PlaceImages DB save error:", err));
      }).catch(err => console.error("MongoDB connection for PlaceImages failed:", err));

      return optimizedUrl;
    }

    const emergency = this.getCuratedFallback(query);
    return this.optimizeUnsplashUrl(emergency);
  }

  /**
   * Fetch multiple images for a query in bulk
   */
  static async fetchBulkPremiumImages(query: string, count = 15): Promise<string[]> {
    const cacheKey = `imgbulk:${query.toLowerCase().trim()}:${count}`;
    const cached = await cacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    const accessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';
    if (!accessKey) {
      const fb = this.getCuratedFallback(query);
      return Array(count).fill(this.optimizeUnsplashUrl(fb));
    }

    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&client_id=${accessKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const urls = await Promise.all(data.results.map(async (r: any, idx: number) => {
            const cleanName = `${query.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 40)}_${idx}`;
            const publicId = `onlyexplore/${cleanName}`;
            return this.uploadCDN(r.urls.regular, publicId);
          }));

          await cacheService.set(cacheKey, urls, 30 * 24 * 60 * 60); // 30 days cache
          return urls;
        }
      }
    } catch (e) {
      console.warn("[ImageService] Bulk fetch error:", e);
    }

    const fb = this.getCuratedFallback(query);
    return Array(count).fill(this.optimizeUnsplashUrl(fb));
  }

  static getCuratedFallback(query: string): string {
    const q = query.toLowerCase();
    for (const [dest, images] of Object.entries(CURATED_FALLBACKS)) {
      if (q.includes(dest)) {
        return images[Math.floor(Math.random() * images.length)];
      }
    }
    const generalFallbacks = [
      "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000",
      "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?q=80&w=1000",
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000",
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1000",
      "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1000"
    ];
    return generalFallbacks[Math.floor(Math.random() * generalFallbacks.length)];
  }
}
export default ImageService;
