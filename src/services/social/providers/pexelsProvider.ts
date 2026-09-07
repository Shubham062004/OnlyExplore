// ─────────────────────────────────────────────────────────────────────────────
// Social Pulse — Pexels Provider
// ─────────────────────────────────────────────────────────────────────────────
// Extends existing OnlyExplore Pexels integration with video search.
//
// API Classification: ✅ OFFICIAL API
// Endpoints: GET /v1/search (photos), GET /videos/search (videos)
// Rate Limit: 200 req/hr, 20,000 req/month
// Location Search: ⚠️ Keyword only
// Engagement Metrics: ❌ Not available
// Commercial Use: ✅ Free for commercial use
// Attribution: Encouraged — "Photo/Video by [Name] on Pexels"
// ─────────────────────────────────────────────────────────────────────────────

import {
  SocialProvider,
  NormalizedSocialContent,
  DestinationEntity,
  ProviderStatus,
} from '../socialTypes';
import { cacheService } from '../../cache.service';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

const PEXELS_PHOTOS_BASE = 'https://api.pexels.com/v1';
const PEXELS_VIDEOS_BASE = 'https://api.pexels.com/videos';

/** Cache TTL for Pexels results: 6 hours */
const PEXELS_CACHE_TTL = 6 * 60 * 60;

export class PexelsProvider implements SocialProvider {
  getProviderName(): string {
    return 'Pexels';
  }

  getStatus(): ProviderStatus {
    if (!PEXELS_API_KEY) return 'no_api_key';
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

    const query = `${entity.name} travel`;
    const cacheKey = `social:pexels:${query.toLowerCase().replace(/\s+/g, '_')}`;

    try {
      const cached = await cacheService.get<NormalizedSocialContent[]>(cacheKey);
      if (cached) return cached;
    } catch {
      // Continue
    }

    // Fetch photos and videos in parallel
    const [photos, videos] = await Promise.allSettled([
      this.fetchPhotos(query, Math.ceil(limit / 2)),
      this.fetchVideos(query, Math.floor(limit / 2)),
    ]);

    const results: NormalizedSocialContent[] = [];

    if (photos.status === 'fulfilled') {
      results.push(...photos.value.map((p: any) => this.normalizePhoto(p, entity)));
    }

    if (videos.status === 'fulfilled') {
      results.push(...videos.value.map((v: any) => this.normalizeVideo(v, entity)));
    }

    const limited = results.slice(0, limit);

    if (limited.length > 0) {
      cacheService.set(cacheKey, limited, PEXELS_CACHE_TTL).catch(() => {});
    }

    return limited;
  }

  async getTrendingContent(
    entity: DestinationEntity,
    limit: number = 10
  ): Promise<NormalizedSocialContent[]> {
    return this.searchContent(entity, limit);
  }

  private async fetchPhotos(query: string, perPage: number): Promise<any[]> {
    try {
      const url = `${PEXELS_PHOTOS_BASE}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

      const res = await fetch(url, {
        headers: { Authorization: PEXELS_API_KEY },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        if (res.status === 429) {
          console.warn('[PexelsProvider] Rate limited (429).');
        }
        return [];
      }

      const data = await res.json();
      return data.photos || [];
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        console.warn('[PexelsProvider] Photos request timed out.');
      }
      return [];
    }
  }

  private async fetchVideos(query: string, perPage: number): Promise<any[]> {
    try {
      const url = `${PEXELS_VIDEOS_BASE}/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;

      const res = await fetch(url, {
        headers: { Authorization: PEXELS_API_KEY },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) return [];

      const data = await res.json();
      return data.videos || [];
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        console.warn('[PexelsProvider] Videos request timed out.');
      }
      return [];
    }
  }

  private normalizePhoto(photo: any, entity: DestinationEntity): NormalizedSocialContent {
    const photographerName = photo.photographer || 'Unknown';
    const photographerUrl = photo.photographer_url || null;

    return {
      id: `pexels:photo:${photo.id}`,
      platform: 'pexels',
      type: 'image',
      title: photo.alt || `${entity.name} Photo`,
      description: photo.alt || null,
      author: photographerName,
      authorUrl: photographerUrl,
      contentUrl: photo.url || `https://www.pexels.com/photo/${photo.id}`,
      thumbnailUrl: photo.src?.landscape || photo.src?.medium || photo.src?.small || null,
      publishedAt: null, // Pexels doesn't provide publish dates for photos
      duration: null,
      locationName: entity.name,
      latitude: null,
      longitude: null,
      hashtags: [],
      views: null,
      likes: null,
      comments: null,
      engagementRate: null,
      source: 'Pexels',
      embedSupported: false,
      attributionRequired: true,
      attributionText: `Photo by ${photographerName} on Pexels`,
      score: 0,
    };
  }

  private normalizeVideo(video: any, entity: DestinationEntity): NormalizedSocialContent {
    const userName = video.user?.name || 'Unknown';
    const userUrl = video.user?.url || null;

    // Get best available video file for thumbnail
    const videoFile = video.video_files?.find(
      (f: any) => f.quality === 'hd' || f.quality === 'sd'
    ) || video.video_files?.[0];

    // Get video thumbnail from video_pictures
    const thumbnail = video.video_pictures?.[0]?.picture || video.image || null;

    return {
      id: `pexels:video:${video.id}`,
      platform: 'pexels',
      type: 'video',
      title: `${entity.name} Travel Video`,
      description: null,
      author: userName,
      authorUrl: userUrl,
      contentUrl: video.url || `https://www.pexels.com/video/${video.id}`,
      thumbnailUrl: thumbnail,
      publishedAt: null,
      duration: video.duration || null,
      locationName: entity.name,
      latitude: null,
      longitude: null,
      hashtags: [],
      views: null,
      likes: null,
      comments: null,
      engagementRate: null,
      source: 'Pexels',
      embedSupported: false,
      attributionRequired: true,
      attributionText: `Video by ${userName} on Pexels`,
      score: 0,
    };
  }
}
