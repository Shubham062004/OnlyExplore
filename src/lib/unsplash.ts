export interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  alt: string;
}

import { connectDB } from './mongodb';
import UnsplashCache from '@/models/UnsplashCache';

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

/**
 * Fetches a single landscape image URL from Unsplash Search API with MongoDB Caching
 */
export async function fetchImage(query: string): Promise<string | null> {
  // 1. Try Cache First
  try {
    await connectDB();
    const cached = await UnsplashCache.findOne({ query: query.toLowerCase() });
    if (cached) return cached.url;
  } catch (err) {
    console.warn("Unsplash Cache Error:", err);
  }

  if (!ACCESS_KEY) {
    console.error("Unsplash Access Key is missing.");
    return null;
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${ACCESS_KEY}`
    );

    if (!res.ok) {
      if (res.status === 403) {
        console.error("Unsplash Rate Limit Exceeded!");
      } else {
        const errorText = await res.text();
        console.error(`Unsplash API Error (${res.status}):`, errorText);
      }
      return null;
    }

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      // DYNAMIC FALLBACK: Use a high-quality keyword-based URL if API search yields no results
      return `https://images.unsplash.com/photo-1506461883276-594a12b11cf3?q=80&w=1000&auto=format&fit=crop`; // generic high-quality
    }

    const imageUrl = data.results[0].urls.regular;

    // 2. Save to Cache
    try {
      await UnsplashCache.create({ query: query.toLowerCase(), url: imageUrl });
    } catch (saveErr) {
      console.warn("Failed to cache image:", saveErr);
    }

    return imageUrl;
  } catch (err) {
    console.error("Unsplash fetch error:", err);
    return null;
  }
}

/**
 * Fetches multiple images for a query
 */
export async function fetchImages(query: string, count = 6): Promise<UnsplashImage[]> {
  if (!ACCESS_KEY) return [];

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&client_id=${ACCESS_KEY}`
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Unsplash API Bulk Error (${res.status}):`, errorText);
      return [];
    }

    const data = await res.json();

    return data.results.map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      thumb: img.urls.small,
      alt: img.alt_description || query,
    }));
  } catch (err) {
    console.error("Unsplash bulk fetch error:", err);
    return [];
  }
}
