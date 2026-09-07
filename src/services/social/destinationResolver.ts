// ─────────────────────────────────────────────────────────────────────────────
// Social Pulse — Destination Entity Resolver
// ─────────────────────────────────────────────────────────────────────────────
// Resolves a user-entered destination string into a canonical DestinationEntity
// with coordinates, aliases, and nearby attractions.
//
// REUSES:
// - PlacesService for Google Places geocoding
// - DestinationCache model for cached guide data
// - cacheService for Redis/memory caching
// ─────────────────────────────────────────────────────────────────────────────

import { DestinationEntity } from './socialTypes';
import { PlacesService } from '../places.service';
import { cacheService } from '../cache.service';
import { connectDB } from '@/lib/mongodb';
import DestinationCache from '@/models/DestinationCache';

/** Cache TTL for destination entities: 30 days (stable data) */
const ENTITY_CACHE_TTL = 30 * 24 * 60 * 60;

/**
 * Resolves a destination name into a structured entity for social content discovery.
 *
 * Resolution pipeline:
 * 1. Check Redis/memory cache
 * 2. Check MongoDB DestinationCache (existing guide data has rich attraction data)
 * 3. Fallback: Google Places API for coordinates + generate search queries
 */
export async function resolveDestination(destination: string): Promise<DestinationEntity> {
  const normalizedName = destination.trim();
  const cacheKey = `social:entity:${normalizedName.toLowerCase()}`;

  // ── 1. Check cache ──────────────────────────────────────────────────────
  try {
    const cached = await cacheService.get<DestinationEntity>(cacheKey);
    if (cached) {
      return cached;
    }
  } catch {
    // Cache read failed, continue
  }

  // ── 2. Check existing DestinationCache for rich guide data ──────────────
  let coordinates = { lat: 0, lng: 0 };
  let nearbyPlaces: string[] = [];
  let country = '';

  try {
    await connectDB();
    const cachedGuide = await DestinationCache.findOne({
      destination: normalizedName.toLowerCase(),
    });

    if (cachedGuide) {
      if (cachedGuide.coordinates) {
        coordinates = cachedGuide.coordinates;
      }

      // Extract attraction names from the guide data
      const guideData = cachedGuide.guideData;
      if (guideData) {
        if (guideData.popularPlaces) {
          nearbyPlaces.push(...guideData.popularPlaces.map((p: any) => p.name).filter(Boolean));
        }
        if (guideData.activities) {
          nearbyPlaces.push(
            ...guideData.activities
              .slice(0, 5)
              .map((a: any) => a.name)
              .filter(Boolean)
          );
        }
        if (guideData.hiddenGems) {
          nearbyPlaces.push(
            ...guideData.hiddenGems
              .slice(0, 3)
              .map((g: any) => g.name)
              .filter(Boolean)
          );
        }
        if (guideData.localFood) {
          nearbyPlaces.push(
            ...guideData.localFood
              .slice(0, 3)
              .map((f: any) => f.name)
              .filter(Boolean)
          );
        }
        // Extract location from quickFacts for country
        if (guideData.quickFacts?.location) {
          country = extractCountry(guideData.quickFacts.location);
        }
      }
    }
  } catch (err) {
    console.warn('[DestinationResolver] MongoDB lookup failed:', err);
  }

  // ── 3. If no coordinates yet, use Google Places ─────────────────────────
  if (coordinates.lat === 0 && coordinates.lng === 0) {
    try {
      const places = await PlacesService.searchPlaces(normalizedName);
      if (places.length > 0) {
        coordinates = places[0].coordinates;
        // Extract country from address
        if (places[0].address) {
          country = country || extractCountry(places[0].address);
        }
        // If no nearby places from guide, use Places results as seeds
        if (nearbyPlaces.length === 0) {
          nearbyPlaces = places.slice(0, 5).map((p) => p.name);
        }
      }
    } catch (err) {
      console.warn('[DestinationResolver] Places API fallback failed:', err);
    }
  }

  // Deduplicate nearby places
  nearbyPlaces = [...new Set(nearbyPlaces)].slice(0, 15);

  // Default country if still unknown
  if (!country) {
    country = 'Unknown';
  }

  // ── 4. Build search queries ─────────────────────────────────────────────
  const aliases = generateAliases(normalizedName);
  const searchQueries = generateSearchQueries(normalizedName, nearbyPlaces);

  const entity: DestinationEntity = {
    name: normalizedName,
    country,
    latitude: coordinates.lat,
    longitude: coordinates.lng,
    aliases,
    nearbyPlaces,
    searchQueries,
  };

  // ── 5. Cache for 30 days ────────────────────────────────────────────────
  cacheService.set(cacheKey, entity, ENTITY_CACHE_TTL).catch(() => {});

  return entity;
}

/**
 * Generates search aliases for a destination.
 * E.g., "Amritsar" → ["Amritsar", "Amritsar Punjab", "Amritsar India", "Amritsar travel"]
 */
function generateAliases(destination: string): string[] {
  const name = destination.trim();
  const aliases = new Set<string>();

  aliases.add(name);
  aliases.add(`${name} travel`);
  aliases.add(`${name} tourism`);
  aliases.add(`${name} trip`);

  return [...aliases];
}

/**
 * Generates contextual search queries for social content discovery.
 * Combines destination name with nearby attractions for targeted searches.
 */
function generateSearchQueries(destination: string, nearbyPlaces: string[]): string[] {
  const queries: string[] = [];

  // Core destination queries
  queries.push(`${destination} travel`);
  queries.push(`${destination} vlog`);
  queries.push(`${destination} food`);
  queries.push(`${destination} things to do`);

  // Top attraction queries (limit to avoid quota exhaustion)
  const topAttractions = nearbyPlaces.slice(0, 5);
  for (const place of topAttractions) {
    queries.push(`${place} ${destination}`);
  }

  return queries;
}

/**
 * Extracts a country name from an address or location string.
 * Simple heuristic: takes the last comma-separated segment.
 */
function extractCountry(locationString: string): string {
  if (!locationString) return '';
  const parts = locationString.split(',').map((s) => s.trim());
  return parts[parts.length - 1] || '';
}
