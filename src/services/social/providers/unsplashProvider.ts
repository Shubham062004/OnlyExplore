// ─────────────────────────────────────────────────────────────────────────────
// Social Pulse — Unsplash Provider
// ─────────────────────────────────────────────────────────────────────────────
// Extends existing OnlyExplore Unsplash integration for social content cards.
//
// API Classification: ✅ OFFICIAL API
// Endpoint: GET /search/photos
// Rate Limit: 50 req/hr (demo), 5000 req/hr (production)
// Location Search: ⚠️ Keyword only (no coordinate search)
// Engagement Metrics: ❌ Not available
// Commercial Use: ✅ With attribution
// Attribution: REQUIRED — "Photo by [Name] on Unsplash" with UTM links
// Storage: Hotlinking required (do not rehost)
// ─────────────────────────────────────────────────────────────────────────────

import {
  SocialProvider,
  NormalizedSocialContent,
  DestinationEntity,
  ProviderStatus,
} from '../socialTypes';
import { cacheService } from '../../cache.service';

const UNSPLASH_ACCESS_KEY =
  process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';

const UNSPLASH_API_BASE = 'https://api.unsplash.com';

/** Cache TTL for Unsplash results: 6 hours (images are relatively stable) */
const UNSPLASH_CACHE_TTL = 6 * 60 * 60;

/** In-memory rate limit tracker */
let rateLimitRemaining = 50;
let rateLimitReset = 0;

function isRateLimited(): boolean {
  return rateLimitRemaining <= 3 && Date.now() < rateLimitReset;
}

/** UTM source for attribution links */
const UTM_SOURCE = 'onlyexplore';

export class UnsplashProvider implements SocialProvider {
  getProviderName(): string {
    return 'Unsplash';
  }

  getStatus(): ProviderStatus {
    if (!UNSPLASH_ACCESS_KEY) return 'no_api_key';
    if (isRateLimited()) return 'rate_limited';
    return 'active';
  }

  isAvailable(): boolean {
    return this.getStatus() === 'active';
  }

  async searchContent(
    entity: DestinationEntity,
    limit: number = 10
  ): Promise<NormalizedSocialContent[]> {
    if (!this.isAvailable()) return [];

    // Use destination name as primary query + top attraction
    const queries = [
      `${entity.name} travel`,
      entity.nearbyPlaces[0] ? `${entity.nearbyPlaces[0]} ${entity.name}` : null,
    ].filter(Boolean) as string[];

    const allResults: NormalizedSocialContent[] = [];

    for (const query of queries) {
      if (!this.isAvailable()) break;
      if (allResults.length >= limit) break;

      const cacheKey = `social:unsplash:${query.toLowerCase().replace(/\s+/g, '_')}`;

      try {
        const cached = await cacheService.get<NormalizedSocialContent[]>(cacheKey);
        if (cached) {
          allResults.push(...cached);
          continue;
        }

        const photos = await this.fetchPhotos(query, Math.min(limit, 10));
        if (photos.length === 0) continue;

        const normalized = photos.map((photo: any) => this.normalizePhoto(photo, entity));

        cacheService.set(cacheKey, normalized, UNSPLASH_CACHE_TTL).catch(() => {});
        allResults.push(...normalized);
      } catch (err) {
        console.warn(`[UnsplashProvider] Search failed for "${query}":`, err);
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return allResults
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      })
      .slice(0, limit);
  }

  async getTrendingContent(
    entity: DestinationEntity,
    limit: number = 10
  ): Promise<NormalizedSocialContent[]> {
    return this.searchContent(entity, limit);
  }

  private async fetchPhotos(query: string, perPage: number): Promise<any[]> {
    try {
      const url = `${UNSPLASH_API_BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`;

      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
      });

      // Track rate limits
      const remaining = res.headers.get('X-Ratelimit-Remaining');
      const reset = res.headers.get('X-Ratelimit-Reset');
      if (remaining) rateLimitRemaining = parseInt(remaining, 10);
      if (reset) rateLimitReset = parseInt(reset, 10) * 1000;

      if (!res.ok) {
        if (res.status === 429) {
          rateLimitRemaining = 0;
          console.warn('[UnsplashProvider] Rate limited (429).');
        }
        return [];
      }

      const data = await res.json();
      return data.results || [];
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        console.warn('[UnsplashProvider] Request timed out.');
      }
      return [];
    }
  }

  private normalizePhoto(photo: any, entity: DestinationEntity): NormalizedSocialContent {
    const photographerName = photo.user?.name || photo.user?.username || 'Unknown';
    const photographerUrl = photo.user?.links?.html
      ? `${photo.user.links.html}?utm_source=${UTM_SOURCE}&utm_medium=referral`
      : null;

    // Use the regular size URL (not raw/full to be respectful of bandwidth)
    const imageUrl = photo.urls?.regular || photo.urls?.small || '';

    return {
      id: `unsplash:${photo.id}`,
      platform: 'unsplash',
      type: 'image',
      title: photo.description || photo.alt_description || `${entity.name} Photography`,
      description: photo.description || photo.alt_description || null,
      author: photographerName,
      authorUrl: photographerUrl,
      contentUrl: `${photo.links?.html}?utm_source=${UTM_SOURCE}&utm_medium=referral`,
      thumbnailUrl: photo.urls?.small || photo.urls?.thumb || imageUrl,
      publishedAt: photo.created_at || null,
      duration: null,
      locationName: photo.location?.name || entity.name,
      latitude: photo.location?.position?.latitude || null,
      longitude: photo.location?.position?.longitude || null,
      hashtags: (photo.tags || []).map((t: any) => `#${t.title || t}`).slice(0, 10),
      views: null, // Unsplash doesn't provide view counts via API
      likes: photo.likes || null,
      comments: null,
      engagementRate: null,
      source: 'Unsplash',
      embedSupported: false, // Hotlinking only, no embed
      attributionRequired: true,
      attributionText: `Photo by ${photographerName} on Unsplash`,
      score: 0,
    };
  }
}
