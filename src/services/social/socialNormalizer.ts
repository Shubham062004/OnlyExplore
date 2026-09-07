// ─────────────────────────────────────────────────────────────────────────────
// Social Pulse — Content Normalizer & Deduplicator
// ─────────────────────────────────────────────────────────────────────────────
// Merges results from multiple providers, deduplicates, and ensures
// consistent data quality across all content items.
// ─────────────────────────────────────────────────────────────────────────────

import { NormalizedSocialContent, ProviderResult } from './socialTypes';

/**
 * Merges, deduplicates, and quality-filters content from multiple providers.
 *
 * Deduplication strategy:
 * 1. Primary: by `id` (platform:externalId — guaranteed unique per provider)
 * 2. Secondary: by canonical URL (catches cross-provider duplicates)
 */
export function normalizeAndDeduplicate(
  providerResults: ProviderResult[]
): NormalizedSocialContent[] {
  // Collect all successful items
  const allItems: NormalizedSocialContent[] = [];

  for (const result of providerResults) {
    if (result.status === 'success' && result.items.length > 0) {
      allItems.push(...result.items);
    }
  }

  // ── Stage 1: Deduplicate by ID ──────────────────────────────────────────
  const seenIds = new Set<string>();
  const deduplicatedById: NormalizedSocialContent[] = [];

  for (const item of allItems) {
    if (!seenIds.has(item.id)) {
      seenIds.add(item.id);
      deduplicatedById.push(item);
    }
  }

  // ── Stage 2: Deduplicate by canonical URL ───────────────────────────────
  const seenUrls = new Set<string>();
  const deduplicated: NormalizedSocialContent[] = [];

  for (const item of deduplicatedById) {
    const canonicalUrl = normalizeUrl(item.contentUrl);
    if (!seenUrls.has(canonicalUrl)) {
      seenUrls.add(canonicalUrl);
      deduplicated.push(item);
    }
  }

  // ── Stage 3: Quality filter ─────────────────────────────────────────────
  const filtered = deduplicated.filter((item) => {
    // Must have a title
    if (!item.title || item.title.trim().length === 0) return false;

    // Must have a content URL
    if (!item.contentUrl) return false;

    // Filter out extremely short titles that are likely garbage
    if (item.title.trim().length < 3) return false;

    return true;
  });

  // ── Stage 4: Sanitize fields ────────────────────────────────────────────
  return filtered.map(sanitizeItem);
}

/**
 * Normalizes a URL for deduplication comparison.
 * Strips protocol, www, trailing slashes, and query parameters.
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Keep hostname + pathname, strip query/hash for canonical comparison
    return `${parsed.hostname}${parsed.pathname}`.replace(/\/+$/, '').toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

/**
 * Sanitizes a content item to ensure safe, clean data.
 */
function sanitizeItem(item: NormalizedSocialContent): NormalizedSocialContent {
  return {
    ...item,
    title: sanitizeText(item.title, 200),
    description: item.description ? sanitizeText(item.description, 500) : null,
    author: item.author ? sanitizeText(item.author, 100) : null,
    // Ensure numeric fields are valid numbers or null
    views: isValidNumber(item.views) ? item.views : null,
    likes: isValidNumber(item.likes) ? item.likes : null,
    comments: isValidNumber(item.comments) ? item.comments : null,
    engagementRate: isValidNumber(item.engagementRate) ? item.engagementRate : null,
    duration: isValidNumber(item.duration) ? item.duration : null,
    // Clean hashtags
    hashtags: (item.hashtags || [])
      .filter((h) => typeof h === 'string' && h.length > 0)
      .slice(0, 20),
  };
}

/**
 * Sanitizes text by trimming and limiting length.
 * Removes HTML tags and control characters.
 */
function sanitizeText(text: string, maxLength: number): string {
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Strip control chars
    .trim()
    .slice(0, maxLength);
}

/**
 * Checks if a value is a valid, finite number.
 */
function isValidNumber(val: number | null | undefined): val is number {
  return typeof val === 'number' && isFinite(val) && val >= 0;
}
