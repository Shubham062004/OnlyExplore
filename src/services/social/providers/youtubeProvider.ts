// ─────────────────────────────────────────────────────────────────────────────
// Social Pulse — YouTube Provider
// ─────────────────────────────────────────────────────────────────────────────
// Uses YouTube Data API v3 (OFFICIAL API) for travel content discovery.
//
// API Classification: ✅ OFFICIAL API
// Endpoint: search.list (100 units/call) + videos.list (1 unit/call)
// Default Quota: 10,000 units/day → ~100 searches/day
// Location Search: ✅ Supported (lat/lng + radius)
// Engagement Metrics: ✅ viewCount, likeCount, commentCount
// Embed: ✅ Official iframe embed
// Commercial Use: ✅ Permitted
// Attribution: Link to YouTube, use official thumbnails
// ─────────────────────────────────────────────────────────────────────────────

import {
  SocialProvider,
  NormalizedSocialContent,
  DestinationEntity,
  ProviderStatus,
} from '../socialTypes';
import { cacheService } from '../../cache.service';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

/** YouTube Data API base URL */
const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

/** Max results per search query */
const MAX_RESULTS_PER_QUERY = 10;

/** Cache TTL for YouTube results: 2 hours */
const YT_CACHE_TTL = 2 * 60 * 60;

/** Daily quota budget reserved for Social Pulse (conservative) */
const DAILY_QUOTA_BUDGET = 3000;

/** In-memory quota tracker (resets on server restart, which is fine for serverless) */
let quotaUsed = 0;
let quotaResetDate = new Date().toDateString();

function checkAndResetQuota(): void {
  const today = new Date().toDateString();
  if (today !== quotaResetDate) {
    quotaUsed = 0;
    quotaResetDate = today;
  }
}

function consumeQuota(units: number): boolean {
  checkAndResetQuota();
  if (quotaUsed + units > DAILY_QUOTA_BUDGET) {
    return false;
  }
  quotaUsed += units;
  return true;
}

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeVideoStats {
  id: string;
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails?: {
    duration?: string;
  };
}

/**
 * Parses ISO 8601 duration (e.g., PT4M13S) to seconds.
 */
function parseDuration(isoDuration: string | undefined): number | null {
  if (!isoDuration) return null;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

export class YouTubeProvider implements SocialProvider {
  getProviderName(): string {
    return 'YouTube';
  }

  getStatus(): ProviderStatus {
    if (!GOOGLE_API_KEY) return 'no_api_key';
    checkAndResetQuota();
    if (quotaUsed >= DAILY_QUOTA_BUDGET) return 'rate_limited';
    return 'active';
  }

  isAvailable(): boolean {
    return this.getStatus() === 'active';
  }

  async searchContent(
    entity: DestinationEntity,
    limit: number = 15
  ): Promise<NormalizedSocialContent[]> {
    if (!this.isAvailable()) return [];

    // Select top search queries (limit API calls to conserve quota)
    const queries = entity.searchQueries.slice(0, 3);
    const allResults: NormalizedSocialContent[] = [];

    for (const query of queries) {
      if (!this.isAvailable()) break;
      if (allResults.length >= limit) break;

      const cacheKey = `social:yt:search:${query.toLowerCase().replace(/\s+/g, '_')}`;

      try {
        // Check cache first
        const cached = await cacheService.get<NormalizedSocialContent[]>(cacheKey);
        if (cached) {
          allResults.push(...cached);
          continue;
        }

        // Perform YouTube search
        const searchResults = await this.youtubeSearch(query, entity);
        if (searchResults.length === 0) continue;

        // Fetch video statistics in batch (much cheaper: 1 unit per videos.list call)
        const videoIds = searchResults.map((r) => r.id.videoId);
        const stats = await this.fetchVideoStats(videoIds);

        // Normalize results
        const normalized = searchResults.map((item) => {
          const videoStats = stats.find((s) => s.id === item.id.videoId);
          return this.normalizeItem(item, videoStats, entity);
        });

        // Cache per-query results
        cacheService.set(cacheKey, normalized, YT_CACHE_TTL).catch(() => {});
        allResults.push(...normalized);
      } catch (err) {
        console.warn(`[YouTubeProvider] Search failed for query "${query}":`, err);
      }
    }

    // Deduplicate by video ID
    const seen = new Set<string>();
    const deduplicated = allResults.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

    return deduplicated.slice(0, limit);
  }

  async getTrendingContent(
    entity: DestinationEntity,
    limit: number = 15
  ): Promise<NormalizedSocialContent[]> {
    // YouTube doesn't have a separate "trending by location" for arbitrary topics.
    // Use search with relevance ordering, which surfaces popular recent content.
    return this.searchContent(entity, limit);
  }

  /**
   * Performs a YouTube Data API search.list call.
   * Cost: 100 quota units per call.
   */
  private async youtubeSearch(
    query: string,
    entity: DestinationEntity
  ): Promise<YouTubeSearchItem[]> {
    if (!consumeQuota(100)) {
      console.warn('[YouTubeProvider] Quota budget exhausted for today.');
      return [];
    }

    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: String(MAX_RESULTS_PER_QUERY),
      order: 'relevance',
      relevanceLanguage: 'en',
      safeSearch: 'moderate',
      key: GOOGLE_API_KEY!,
    });

    // Add location filter if coordinates are available
    if (entity.latitude !== 0 && entity.longitude !== 0) {
      params.set('location', `${entity.latitude},${entity.longitude}`);
      params.set('locationRadius', '50km');
    }

    try {
      const res = await fetch(`${YT_API_BASE}/search?${params.toString()}`, {
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        if (res.status === 403) {
          console.error('[YouTubeProvider] 403 — Quota exceeded or API key invalid.');
          quotaUsed = DAILY_QUOTA_BUDGET; // Mark as exhausted
        }
        return [];
      }

      const data = await res.json();
      return data.items || [];
    } catch (err: any) {
      if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
        console.warn('[YouTubeProvider] Search request timed out.');
      } else {
        console.warn('[YouTubeProvider] Search fetch error:', err?.message || err);
      }
      return [];
    }
  }

  /**
   * Fetches video statistics in batch.
   * Cost: 1 quota unit per videos.list call (much cheaper than search).
   */
  private async fetchVideoStats(videoIds: string[]): Promise<YouTubeVideoStats[]> {
    if (videoIds.length === 0) return [];
    if (!consumeQuota(1)) return [];

    try {
      const params = new URLSearchParams({
        part: 'statistics,contentDetails',
        id: videoIds.join(','),
        key: GOOGLE_API_KEY!,
      });

      const res = await fetch(`${YT_API_BASE}/videos?${params.toString()}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) return [];

      const data = await res.json();
      return data.items || [];
    } catch {
      return [];
    }
  }

  /**
   * Normalizes a YouTube search result + stats into NormalizedSocialContent.
   */
  private normalizeItem(
    item: YouTubeSearchItem,
    stats: YouTubeVideoStats | undefined,
    entity: DestinationEntity
  ): NormalizedSocialContent {
    const videoId = item.id.videoId;
    const snippet = item.snippet;
    const thumbnail =
      snippet.thumbnails.high?.url ||
      snippet.thumbnails.medium?.url ||
      snippet.thumbnails.default?.url ||
      null;

    const views = stats?.statistics?.viewCount ? parseInt(stats.statistics.viewCount, 10) : null;
    const likes = stats?.statistics?.likeCount ? parseInt(stats.statistics.likeCount, 10) : null;
    const commentCount = stats?.statistics?.commentCount
      ? parseInt(stats.statistics.commentCount, 10)
      : null;

    const duration = parseDuration(stats?.contentDetails?.duration);

    // Determine content type based on duration
    let contentType: 'video' | 'short' = 'video';
    if (duration !== null && duration <= 60) {
      contentType = 'short';
    }

    // Calculate engagement rate
    let engagementRate: number | null = null;
    if (views !== null && views > 0 && likes !== null) {
      engagementRate = ((likes + (commentCount || 0)) / views) * 100;
    }

    // Extract hashtags from title and description
    const textToScan = `${snippet.title} ${snippet.description}`;
    const hashtags = (textToScan.match(/#\w+/g) || []).map((h) => h.toLowerCase());

    return {
      id: `youtube:${videoId}`,
      platform: 'youtube',
      type: contentType,
      title: snippet.title,
      description: snippet.description?.slice(0, 300) || null,
      author: snippet.channelTitle,
      authorUrl: `https://www.youtube.com/channel/${snippet.channelId}`,
      contentUrl: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnailUrl: thumbnail,
      publishedAt: snippet.publishedAt,
      duration,
      locationName: entity.name,
      latitude: entity.latitude || null,
      longitude: entity.longitude || null,
      hashtags,
      views,
      likes,
      comments: commentCount,
      engagementRate,
      source: 'YouTube',
      embedSupported: true,
      attributionRequired: true,
      attributionText: `Video by ${snippet.channelTitle} on YouTube`,
      score: 0, // Set by ranker
    };
  }
}
