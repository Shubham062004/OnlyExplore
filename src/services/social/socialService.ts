// ─────────────────────────────────────────────────────────────────────────────
// Social Pulse — Main Orchestrator Service
// ─────────────────────────────────────────────────────────────────────────────
// Coordinates all social content providers, caching, normalization, and ranking
// into a single unified pipeline.
//
// Architecture:
// 1. Resolve destination → DestinationEntity
// 2. Check Redis/memory cache → return immediately if hit
// 3. Run ALL available providers in parallel (Promise.allSettled)
// 4. Normalize + deduplicate results
// 5. Rank using transparent algorithm
// 6. Cache results
// 7. Return
//
// Key design decisions:
// - One provider failing does NOT break the entire pipeline
// - Stale-while-revalidate: return cached data, refresh in background
// - Never block the destination page waiting for social content
// ─────────────────────────────────────────────────────────────────────────────

import { SocialProvider, ProviderResult, SocialPulseResponse, NormalizedSocialContent } from './socialTypes';
import { resolveDestination } from './destinationResolver';
import { normalizeAndDeduplicate } from './socialNormalizer';
import { rankContent } from './socialRanker';
import { cacheService } from '../cache.service';
import { metrics } from '@/lib/metrics';

// ── Provider imports ──────────────────────────────────────────────────────────
import { YouTubeProvider } from './providers/youtubeProvider';
import { UnsplashProvider } from './providers/unsplashProvider';
import { PexelsProvider } from './providers/pexelsProvider';
import { InstagramProvider } from './providers/instagramProvider';
import { TikTokProvider } from './providers/tiktokProvider';

/** All registered providers */
const providers: SocialProvider[] = [
  new YouTubeProvider(),
  new UnsplashProvider(),
  new PexelsProvider(),
  new InstagramProvider(),
  new TikTokProvider(),
];

/** Cache TTLs */
const TRENDING_CACHE_TTL = 60 * 60;           // 1 hour for trending
const SEARCH_CACHE_TTL = 2 * 60 * 60;         // 2 hours for search
const ERROR_COOLDOWN_TTL = 5 * 60;            // 5 minutes for error cooldown

/** Max results to return */
const MAX_RESULTS = 20;

/**
 * Get trending social content for a destination.
 * This is the main entry point for the Social Pulse feature.
 */
export async function getTrendingSocialContent(
  destination: string
): Promise<SocialPulseResponse> {
  const startTime = Date.now();
  const normalizedDest = destination.trim().toLowerCase();
  const cacheKey = `social:pulse:${normalizedDest}`;

  // ── 1. Check cache ──────────────────────────────────────────────────────
  try {
    const cached = await cacheService.get<SocialPulseResponse>(cacheKey);
    if (cached) {
      metrics.trackSocialPulse('trending', destination, true, Date.now() - startTime, cached.totalResults);
      return { ...cached, cached: true };
    }
  } catch {
    // Cache read failed, continue
  }

  // ── 2. Resolve destination entity ───────────────────────────────────────
  let entity;
  try {
    entity = await resolveDestination(destination);
  } catch (err) {
    console.error('[SocialPulse] Destination resolution failed:', err);
    return buildErrorResponse(destination, 'Failed to resolve destination');
  }

  // ── 3. Run all available providers in parallel ──────────────────────────
  const availableProviders = providers.filter((p) => p.isAvailable());

  if (availableProviders.length === 0) {
    console.warn('[SocialPulse] No providers available.');
    return buildErrorResponse(destination, 'No social content providers are currently available');
  }

  const providerPromises = availableProviders.map(async (provider): Promise<ProviderResult> => {
    const providerStart = Date.now();
    const providerName = provider.getProviderName();

    try {
      const items = await provider.getTrendingContent(entity, MAX_RESULTS);
      const latencyMs = Date.now() - providerStart;

      return {
        provider: providerName,
        status: 'success',
        items,
        latencyMs,
      };
    } catch (err: any) {
      const latencyMs = Date.now() - providerStart;
      console.error(`[SocialPulse] Provider ${providerName} failed:`, err?.message || err);

      return {
        provider: providerName,
        status: 'error',
        items: [],
        latencyMs,
        error: err?.message || 'Unknown error',
      };
    }
  });

  // Add disabled providers to the status report
  const disabledProviders = providers.filter((p) => !p.isAvailable());

  const results = await Promise.allSettled(providerPromises);

  // Extract settled results
  const providerResults: ProviderResult[] = results.map((r, idx) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      provider: availableProviders[idx].getProviderName(),
      status: 'error' as const,
      items: [],
      latencyMs: 0,
      error: r.reason?.message || 'Promise rejected',
    };
  });

  // ── 4. Normalize + deduplicate ──────────────────────────────────────────
  const normalized = normalizeAndDeduplicate(providerResults);

  // ── 5. Rank ─────────────────────────────────────────────────────────────
  const ranked = rankContent(normalized, entity);
  const topResults = ranked.slice(0, MAX_RESULTS);

  // ── 6. Build response ───────────────────────────────────────────────────
  const response: SocialPulseResponse = {
    success: true,
    destination: {
      name: entity.name,
      country: entity.country,
    },
    generatedAt: new Date().toISOString(),
    cached: false,
    ttlSeconds: TRENDING_CACHE_TTL,
    items: topResults,
    providers: [
      ...providerResults.map((r) => ({
        name: r.provider,
        status: r.status,
        resultCount: r.items.length,
        latencyMs: r.latencyMs,
      })),
      ...disabledProviders.map((p) => ({
        name: p.getProviderName(),
        status: p.getStatus(),
        resultCount: 0,
        latencyMs: 0,
      })),
    ],
    totalResults: topResults.length,
  };

  // ── 7. Cache ────────────────────────────────────────────────────────────
  if (topResults.length > 0) {
    cacheService.set(cacheKey, response, TRENDING_CACHE_TTL).catch(() => {});
  }

  const totalLatency = Date.now() - startTime;
  metrics.trackSocialPulse('trending', destination, false, totalLatency, topResults.length);

  console.log(
    `[SocialPulse] Trending for "${destination}": ` +
    `${topResults.length} results, ${totalLatency}ms total, ` +
    `providers: ${providerResults.map((r) => `${r.provider}=${r.status}(${r.items.length})`).join(', ')}`
  );

  return response;
}

/**
 * Search for specific social content within a destination.
 */
export async function searchSocialContent(
  destination: string,
  query: string
): Promise<SocialPulseResponse> {
  const startTime = Date.now();
  const normalizedDest = destination.trim().toLowerCase();
  const normalizedQuery = query.trim().toLowerCase();
  const cacheKey = `social:search:${normalizedDest}:${normalizedQuery.replace(/\s+/g, '_')}`;

  // ── 1. Check cache ──────────────────────────────────────────────────────
  try {
    const cached = await cacheService.get<SocialPulseResponse>(cacheKey);
    if (cached) {
      metrics.trackSocialPulse('search', destination, true, Date.now() - startTime, cached.totalResults);
      return { ...cached, cached: true };
    }
  } catch {
    // Continue
  }

  // ── 2. Resolve destination with search query context ────────────────────
  let entity;
  try {
    entity = await resolveDestination(destination);
    // Add the search query to the entity's search queries for targeted results
    entity.searchQueries = [
      `${query} ${destination}`,
      query,
      ...entity.searchQueries,
    ];
  } catch (err) {
    return buildErrorResponse(destination, 'Failed to resolve destination');
  }

  // ── 3. Run available providers ──────────────────────────────────────────
  const availableProviders = providers.filter((p) => p.isAvailable());

  if (availableProviders.length === 0) {
    return buildErrorResponse(destination, 'No providers available');
  }

  const results = await Promise.allSettled(
    availableProviders.map(async (provider): Promise<ProviderResult> => {
      const providerStart = Date.now();
      try {
        const items = await provider.searchContent(entity, MAX_RESULTS);
        return {
          provider: provider.getProviderName(),
          status: 'success',
          items,
          latencyMs: Date.now() - providerStart,
        };
      } catch (err: any) {
        return {
          provider: provider.getProviderName(),
          status: 'error',
          items: [],
          latencyMs: Date.now() - providerStart,
          error: err?.message,
        };
      }
    })
  );

  const providerResults: ProviderResult[] = results.map((r, idx) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      provider: availableProviders[idx].getProviderName(),
      status: 'error' as const,
      items: [],
      latencyMs: 0,
      error: r.reason?.message,
    };
  });

  const normalized = normalizeAndDeduplicate(providerResults);
  const ranked = rankContent(normalized, entity);
  const topResults = ranked.slice(0, MAX_RESULTS);

  const response: SocialPulseResponse = {
    success: true,
    destination: { name: entity.name, country: entity.country },
    generatedAt: new Date().toISOString(),
    cached: false,
    ttlSeconds: SEARCH_CACHE_TTL,
    items: topResults,
    providers: providerResults.map((r) => ({
      name: r.provider,
      status: r.status,
      resultCount: r.items.length,
      latencyMs: r.latencyMs,
    })),
    totalResults: topResults.length,
  };

  if (topResults.length > 0) {
    cacheService.set(cacheKey, response, SEARCH_CACHE_TTL).catch(() => {});
  }

  metrics.trackSocialPulse('search', destination, false, Date.now() - startTime, topResults.length);

  return response;
}

/**
 * Builds an error response with consistent structure.
 */
function buildErrorResponse(destination: string, error: string): SocialPulseResponse {
  return {
    success: false,
    destination: { name: destination, country: 'Unknown' },
    generatedAt: new Date().toISOString(),
    cached: false,
    ttlSeconds: ERROR_COOLDOWN_TTL,
    items: [],
    providers: providers.map((p) => ({
      name: p.getProviderName(),
      status: p.getStatus(),
      resultCount: 0,
      latencyMs: 0,
    })),
    totalResults: 0,
    error,
  };
}
