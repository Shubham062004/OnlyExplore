// ─────────────────────────────────────────────────────────────────────────────
// Social Pulse — Transparent Ranking Algorithm
// ─────────────────────────────────────────────────────────────────────────────
// Ranks normalized social content using a transparent, weighted scoring system.
//
// Formula:
//   finalScore =
//     0.30 × locationRelevance    (how well content matches destination)
//     + 0.20 × recencyScore       (time decay, newer = higher)
//     + 0.20 × engagementScore    (platform-normalized engagement)
//     + 0.15 × popularityScore    (platform-normalized absolute popularity)
//     + 0.10 × contentQuality     (has thumbnail, title, description)
//     + 0.05 × sourceConfidence   (platform trust tier)
//
// All components normalized to 0–100.
// Platform-specific normalization prevents cross-platform comparison bias.
// ─────────────────────────────────────────────────────────────────────────────

import { NormalizedSocialContent, DestinationEntity, SocialPlatform } from './socialTypes';

/** Ranking weights — must sum to 1.0 */
const WEIGHTS = {
  locationRelevance: 0.30,
  recency: 0.20,
  engagement: 0.20,
  popularity: 0.15,
  contentQuality: 0.10,
  sourceConfidence: 0.05,
} as const;

/** Source confidence tiers (0-100) */
const SOURCE_CONFIDENCE: Record<SocialPlatform, number> = {
  youtube: 90,       // Official API with full metrics
  google_places: 85, // Official structured data
  unsplash: 70,      // High-quality curated photos, no engagement data
  pexels: 65,        // Stock content, no engagement data
  instagram: 80,     // Would be high if available
  tiktok: 75,        // Would be high if available
  pinterest: 60,     // Would be moderate if available
};

/**
 * Time decay constants.
 * Content within 1 day gets full recency score.
 * Content older than 90 days gets minimum recency (but not zero — evergreen content).
 */
const RECENCY_FULL_SCORE_HOURS = 24;
const RECENCY_HALF_LIFE_DAYS = 14;
const RECENCY_MIN_SCORE = 15; // Evergreen content floor

/**
 * Ranks social content items using the transparent weighted formula.
 * Mutates the `score` field on each item and returns items sorted by score descending.
 */
export function rankContent(
  items: NormalizedSocialContent[],
  entity: DestinationEntity
): NormalizedSocialContent[] {
  if (items.length === 0) return [];

  // Pre-compute platform-specific max values for normalization
  const platformMaxViews = computePlatformMaxes(items, 'views');
  const platformMaxLikes = computePlatformMaxes(items, 'likes');

  // Score each item
  for (const item of items) {
    const locationRelevance = computeLocationRelevance(item, entity);
    const recency = computeRecencyScore(item.publishedAt);
    const engagement = computeEngagementScore(item, platformMaxLikes);
    const popularity = computePopularityScore(item, platformMaxViews);
    const contentQuality = computeContentQuality(item);
    const sourceConfidence = SOURCE_CONFIDENCE[item.platform] || 50;

    item.score = Math.round(
      WEIGHTS.locationRelevance * locationRelevance +
      WEIGHTS.recency * recency +
      WEIGHTS.engagement * engagement +
      WEIGHTS.popularity * popularity +
      WEIGHTS.contentQuality * contentQuality +
      WEIGHTS.sourceConfidence * sourceConfidence
    );

    // Clamp to 0-100
    item.score = Math.max(0, Math.min(100, item.score));
  }

  // Sort by score descending
  return items.sort((a, b) => b.score - a.score);
}

/**
 * Computes location relevance (0-100).
 * Checks: destination name match, attraction match, location name match, hashtag match.
 */
function computeLocationRelevance(
  item: NormalizedSocialContent,
  entity: DestinationEntity
): number {
  let score = 0;
  const searchText = `${item.title} ${item.description || ''} ${item.locationName || ''}`
    .toLowerCase();
  const hashtagText = item.hashtags.join(' ').toLowerCase();

  // Destination name match in title/description (strong signal)
  if (searchText.includes(entity.name.toLowerCase())) {
    score += 40;
  }

  // Destination alias match
  for (const alias of entity.aliases) {
    if (searchText.includes(alias.toLowerCase()) || hashtagText.includes(alias.toLowerCase().replace(/\s+/g, ''))) {
      score += 10;
      break;
    }
  }

  // Nearby attraction match (strong signal)
  for (const place of entity.nearbyPlaces) {
    if (searchText.includes(place.toLowerCase())) {
      score += 25;
      break;
    }
  }

  // Location name set and matches destination
  if (item.locationName && item.locationName.toLowerCase().includes(entity.name.toLowerCase())) {
    score += 15;
  }

  // Geographic proximity (if coordinates available)
  if (
    item.latitude !== null &&
    item.longitude !== null &&
    entity.latitude !== 0 &&
    entity.longitude !== 0
  ) {
    const distKm = haversineDistance(
      entity.latitude,
      entity.longitude,
      item.latitude,
      item.longitude
    );
    if (distKm < 10) score += 20;
    else if (distKm < 50) score += 10;
    else if (distKm < 200) score += 5;
  }

  return Math.min(100, score);
}

/**
 * Computes recency score (0-100) with time decay.
 * Recent content scores higher, but evergreen attractions get a floor score.
 */
function computeRecencyScore(publishedAt: string | null): number {
  if (!publishedAt) return 50; // Unknown date → neutral score

  const publishDate = new Date(publishedAt);
  if (isNaN(publishDate.getTime())) return 50;

  const now = Date.now();
  const ageMs = now - publishDate.getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  // Very recent: full score
  if (ageHours <= RECENCY_FULL_SCORE_HOURS) return 100;

  // Exponential decay with half-life
  const ageDays = ageHours / 24;
  const decayFactor = Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
  const decayedScore = RECENCY_MIN_SCORE + (100 - RECENCY_MIN_SCORE) * decayFactor;

  return Math.max(RECENCY_MIN_SCORE, Math.round(decayedScore));
}

/**
 * Computes engagement score (0-100) with platform-specific normalization.
 * Uses engagement rate when available, falls back to like count.
 */
function computeEngagementScore(
  item: NormalizedSocialContent,
  platformMaxLikes: Map<SocialPlatform, number>
): number {
  // If engagement rate is available, use it directly
  if (item.engagementRate !== null && item.engagementRate > 0) {
    // YouTube typical engagement rate: 1-5% is good, 10%+ is exceptional
    if (item.platform === 'youtube') {
      if (item.engagementRate >= 10) return 100;
      if (item.engagementRate >= 5) return 80;
      return Math.min(100, Math.round(item.engagementRate * 15));
    }
    // Generic engagement rate scoring
    return Math.min(100, Math.round(item.engagementRate * 10));
  }

  // Fallback: normalize likes against platform max
  if (item.likes !== null && item.likes > 0) {
    const maxLikes = platformMaxLikes.get(item.platform) || 1;
    return Math.min(100, Math.round((item.likes / maxLikes) * 100));
  }

  // No engagement data → neutral score
  return 50;
}

/**
 * Computes popularity score (0-100) based on view count.
 * Platform-specific normalization ensures cross-platform fairness.
 */
function computePopularityScore(
  item: NormalizedSocialContent,
  platformMaxViews: Map<SocialPlatform, number>
): number {
  if (item.views === null || item.views <= 0) return 50; // No data → neutral

  const maxViews = platformMaxViews.get(item.platform) || 1;

  // Logarithmic normalization to prevent extreme outliers from dominating
  const logViews = Math.log10(item.views + 1);
  const logMax = Math.log10(maxViews + 1);

  return Math.min(100, Math.round((logViews / logMax) * 100));
}

/**
 * Computes content quality score (0-100) based on metadata completeness.
 */
function computeContentQuality(item: NormalizedSocialContent): number {
  let score = 0;

  // Has thumbnail (important for display)
  if (item.thumbnailUrl) score += 25;

  // Title quality
  if (item.title && item.title.length > 10) score += 20;
  else if (item.title && item.title.length > 3) score += 10;

  // Has description
  if (item.description && item.description.length > 20) score += 15;

  // Has author
  if (item.author) score += 10;

  // Has publish date
  if (item.publishedAt) score += 10;

  // Video content (generally more engaging)
  if (item.type === 'video' || item.type === 'reel' || item.type === 'short') score += 10;

  // Has engagement metrics (more trustworthy)
  if (item.views !== null || item.likes !== null) score += 10;

  return Math.min(100, score);
}

/**
 * Pre-computes maximum values per platform for normalization.
 * Uses the provided field name to extract max values.
 */
function computePlatformMaxes(
  items: NormalizedSocialContent[],
  field: 'views' | 'likes'
): Map<SocialPlatform, number> {
  const maxes = new Map<SocialPlatform, number>();

  for (const item of items) {
    const value = item[field];
    if (value !== null && value > 0) {
      const current = maxes.get(item.platform) || 0;
      if (value > current) {
        maxes.set(item.platform, value);
      }
    }
  }

  return maxes;
}

/**
 * Haversine distance in kilometers between two coordinates.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
