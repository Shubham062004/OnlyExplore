import PlaceImages from '@/models/PlaceImages';
import { connectDB } from '@/lib/mongodb';

/**
 * Premium Image Service for OnlyExplore
 * Handles intelligent query generation, Unsplash API interaction, 
 * deduplication, and MongoDB caching.
 */

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop";

// Curated high-quality fallbacks for major destinations
const CURATED_FALLBACKS: Record<string, string[]> = {
  'manali': [
    'https://images.unsplash.com/photo-1591266128243-e4a67f6002c1?auto=format&fit=crop&q=80', // Rohtang
    'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80', // Solang
    'https://images.unsplash.com/photo-1605146768851-eda79da39897?auto=format&fit=crop&q=80', // Old Manali
  ],
  'goa': [
    'https://images.unsplash.com/photo-1512789172734-7b099dbd15a6?auto=format&fit=crop&q=80', // Beach
    'https://images.unsplash.com/photo-1614082242765-7c98ca0f3df3?auto=format&fit=crop&q=80', // Church
  ],
  'rishikesh': [
    'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80', // Ganges
    'https://images.unsplash.com/photo-1563205096-7c9f80998f4c?auto=format&fit=crop&q=80', // Laxman Jhula
  ]
};

/**
 * Generates a cinematic, contextual image query based on category.
 */
export function generateContextualQuery(params: {
  destination: string;
  name?: string;
  category: 'landmark' | 'activity' | 'stay' | 'cafe' | 'nature' | 'hero';
  vibe?: string;
  season?: string;
}): string {
  const { destination, name, category, vibe, season } = params;
  const base = name ? `${name} in ${destination}` : destination;
  
  const mood = vibe || 'cinematic travel photography';
  const time = season ? `${season} season` : 'golden hour';

  const categoryModifiers = {
    hero: 'stunning aerial landscape wide angle 4k',
    landmark: 'iconic landmark heritage architecture high quality',
    activity: 'action shot adventure exploration outdoor',
    stay: 'luxury resort boutique hotel interior exterior architectural',
    cafe: 'aesthetic cozy cafe food coffee table view',
    nature: 'scenic nature landscape mountains river forest'
  };

  return `${base} ${categoryModifiers[category]} ${mood} ${time} tourism professional`.trim();
}

/**
 * Fetches an image from Unsplash with intelligent fallbacks and caching.
 */
export async function fetchPremiumImage(query: string, options: { 
  cacheKey?: string, 
  fallbackQuery?: string,
  forceFresh?: boolean 
} = {}): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';
  
  // 1. Check Cache if key provided
  if (options.cacheKey && !options.forceFresh) {
    try {
      await connectDB();
      const cached = await PlaceImages.findOne({ placeKey: options.cacheKey.toLowerCase() });
      if (cached && cached.images && cached.images.length > 0) {
        // Return a random image from the cached set for variety
        return cached.images[Math.floor(Math.random() * cached.images.length)];
      }
    } catch (e) {
      console.warn("Cache fetch error:", e);
    }
  }

  // 2. Fetch from Unsplash
  if (!accessKey) {
    console.warn("Unsplash API Key missing! Using curated fallbacks.");
    return getEmergencyFallback(query);
  }

  const tryFetch = async (q: string) => {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=5&orientation=landscape&client_id=${accessKey}`;
      const res = await fetch(url, { next: { revalidate: 86400 } }); // Cache API response for 24h
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
    const images = results.map((r: any) => r.urls.regular);
    
    // Save to Cache in background (don't block the response, but handle errors)
    if (options.cacheKey) {
      await connectDB();
      PlaceImages.findOneAndUpdate(
        { placeKey: options.cacheKey.toLowerCase() },
        { 
          placeName: query, 
          cityName: query.split(' ').pop() || '', 
          images, 
          lastFetched: new Date() 
        },
        { upsert: true, new: true }
      ).catch(err => console.error("Cache save error:", err));
    }

    return images[0];
  }

  // 3. Absolute Fallback
  return getEmergencyFallback(query);
}

/**
 * Returns a high-quality fallback image based on the destination name in the query.
 */
function getEmergencyFallback(query: string): string {
  const q = query.toLowerCase();
  for (const [dest, images] of Object.entries(CURATED_FALLBACKS)) {
    if (q.includes(dest)) {
      return images[Math.floor(Math.random() * images.length)];
    }
  }
  return FALLBACK_IMAGE;
}

/**
 * Validates an image URL to ensure it's not a generic placeholder or broken.
 */
export function isSafeImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const isGeneric = url.includes('placeholder') || 
                    url.includes('source.unsplash.com') || 
                    url.includes('plus.unsplash.com') ||
                    url.includes('images.unsplash.com/photo-1469854523086-cc02fe5d8800'); // the default desert photo
  return !isGeneric;
}
