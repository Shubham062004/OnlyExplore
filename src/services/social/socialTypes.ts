// ─────────────────────────────────────────────────────────────────────────────
// Social Pulse — Core Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * All content types supported across providers.
 * Not every provider supports every type — providers must return only types they natively support.
 */
export type SocialContentType = 'image' | 'video' | 'reel' | 'short' | 'post' | 'place' | 'event';

/**
 * Supported platform identifiers.
 * Only platforms with verified, legal API access are included.
 */
export type SocialPlatform = 'youtube' | 'unsplash' | 'pexels' | 'google_places' | 'instagram' | 'tiktok' | 'pinterest';

/**
 * Provider availability status.
 */
export type ProviderStatus = 'active' | 'disabled' | 'rate_limited' | 'error' | 'no_api_key';

/**
 * Normalized social content item.
 * Every provider MUST return data in this format.
 * Fields unavailable from a provider MUST remain null — never fabricated.
 */
export interface NormalizedSocialContent {
  /** Unique ID: `{platform}:{externalId}` */
  id: string;
  /** Source platform */
  platform: SocialPlatform;
  /** Content type */
  type: SocialContentType;
  /** Content title or caption */
  title: string;
  /** Content description/body (nullable) */
  description: string | null;
  /** Creator/author display name */
  author: string | null;
  /** URL to author's profile on the platform */
  authorUrl: string | null;
  /** Direct URL to the content on the platform */
  contentUrl: string;
  /** Thumbnail image URL (must be official/permitted URL, not rehosted) */
  thumbnailUrl: string | null;
  /** ISO 8601 publish date */
  publishedAt: string | null;
  /** Duration in seconds (videos/reels only) */
  duration: number | null;
  /** Location name associated with the content */
  locationName: string | null;
  /** Latitude (if available from provider) */
  latitude: number | null;
  /** Longitude (if available from provider) */
  longitude: number | null;
  /** Associated hashtags */
  hashtags: string[];
  /** View count (null if unavailable — never fabricated) */
  views: number | null;
  /** Like count (null if unavailable — never fabricated) */
  likes: number | null;
  /** Comment count (null if unavailable — never fabricated) */
  comments: number | null;
  /** Engagement rate: (likes + comments) / views — null if metrics unavailable */
  engagementRate: number | null;
  /** Human-readable source label for UI display */
  source: string;
  /** Whether the platform supports official embedding */
  embedSupported: boolean;
  /** Whether attribution is legally required */
  attributionRequired: boolean;
  /** Required attribution text (e.g., "Photo by John on Unsplash") */
  attributionText: string | null;
  /** Computed relevance/trend score (0-100) — set by ranker, not provider */
  score: number;
}

/**
 * Resolved destination entity for search queries.
 * Built from existing DestinationCache + PlacesService data.
 */
export interface DestinationEntity {
  /** Canonical destination name */
  name: string;
  /** Country name */
  country: string;
  /** Center latitude */
  latitude: number;
  /** Center longitude */
  longitude: number;
  /** Search aliases for this destination */
  aliases: string[];
  /** Notable nearby places/attractions */
  nearbyPlaces: string[];
  /** Search keywords derived from destination + attractions */
  searchQueries: string[];
}

/**
 * Common interface for all social content providers.
 * Providers implement this interface to participate in the Social Pulse system.
 */
export interface SocialProvider {
  /**
   * Search for content related to a destination.
   * @param entity - Resolved destination entity
   * @param limit - Maximum number of results
   * @returns Normalized content items
   */
  searchContent(entity: DestinationEntity, limit?: number): Promise<NormalizedSocialContent[]>;

  /**
   * Get trending/popular content for a destination.
   * Some providers may not distinguish trending from search — in that case, alias to searchContent.
   */
  getTrendingContent(entity: DestinationEntity, limit?: number): Promise<NormalizedSocialContent[]>;

  /**
   * Check if this provider is currently available (has API key, not rate-limited, etc.)
   */
  isAvailable(): boolean;

  /**
   * Get the human-readable provider name.
   */
  getProviderName(): string;

  /**
   * Get current provider status.
   */
  getStatus(): ProviderStatus;
}

/**
 * Result from a single provider fetch operation.
 * Used internally for tracking per-provider performance.
 */
export interface ProviderResult {
  provider: string;
  status: 'success' | 'error' | 'disabled' | 'rate_limited';
  items: NormalizedSocialContent[];
  latencyMs: number;
  error?: string;
}

/**
 * Social Pulse API response shape.
 */
export interface SocialPulseResponse {
  success: boolean;
  destination: {
    name: string;
    country: string;
  };
  generatedAt: string;
  cached: boolean;
  ttlSeconds: number;
  items: NormalizedSocialContent[];
  providers: {
    name: string;
    status: string;
    resultCount: number;
    latencyMs: number;
  }[];
  totalResults: number;
  error?: string;
}

/**
 * Cache wrapper for Social Pulse results.
 */
export interface SocialPulseCacheEntry {
  destination: string;
  response: SocialPulseResponse;
  generatedAt: number;
  expiresAt: number;
}
