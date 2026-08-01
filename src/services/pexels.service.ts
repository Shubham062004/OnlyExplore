/**
 * Pexels Image Fallback Service
 * Used when Unsplash API is rate-limited, down, or credentials are missing.
 * Free tier: 200 requests/hour.
 */

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    landscape: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
}

export class PexelsService {
  private static rateLimitRemaining = 200;
  private static rateLimitReset = 0;

  /**
   * Check if Pexels API is available and configured.
   */
  static isAvailable(): boolean {
    return !!PEXELS_API_KEY && this.rateLimitRemaining > 5;
  }

  /**
   * Search for landscape photos on Pexels.
   * Returns optimized image URLs.
   */
  static async searchPhotos(query: string, perPage = 5): Promise<string[]> {
    if (!PEXELS_API_KEY) {
      return [];
    }

    // Respect rate limits
    if (this.rateLimitRemaining <= 5 && Date.now() < this.rateLimitReset) {
      console.warn('[PexelsService] Rate limit approaching, skipping request.');
      return [];
    }

    try {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
      const res = await fetch(url, {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      // Update rate limit tracking from headers
      const remaining = res.headers.get('X-Ratelimit-Remaining');
      const reset = res.headers.get('X-Ratelimit-Reset');
      if (remaining) this.rateLimitRemaining = parseInt(remaining, 10);
      if (reset) this.rateLimitReset = parseInt(reset, 10) * 1000;

      if (!res.ok) {
        console.warn(`[PexelsService] API error: ${res.status} ${res.statusText}`);
        return [];
      }

      const data: PexelsSearchResponse = await res.json();

      if (!data.photos || data.photos.length === 0) {
        return [];
      }

      // Return landscape-optimized URLs
      return data.photos.map(photo => photo.src.landscape || photo.src.large);
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        console.warn('[PexelsService] Request timed out for query:', query);
      } else {
        console.warn('[PexelsService] Fetch error:', err?.message || err);
      }
      return [];
    }
  }

  /**
   * Fetch a single photo from Pexels for a given query.
   */
  static async fetchSinglePhoto(query: string): Promise<string | null> {
    const photos = await this.searchPhotos(query, 1);
    return photos.length > 0 ? photos[0] : null;
  }

  /**
   * Fetch multiple photos for bulk use.
   */
  static async fetchBulkPhotos(query: string, count = 10): Promise<string[]> {
    return this.searchPhotos(query, Math.min(count, 15));
  }
}

export default PexelsService;
