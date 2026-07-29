import { safeImageResolver } from './imageUtils';
import type { DestinationGuideData } from '@/services/destination.service';

// ─────────────────────────────────────────────────────────────────────────────
// Types & Schemas
// ─────────────────────────────────────────────────────────────────────────────

export interface ExplorerPoint {
  id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  rating: number;
  duration: string;
  type: 'attraction' | 'activity' | 'stay';
  coordinates: {
    lat: number;
    lng: number;
  };
  tags?: string[];
  bestTime?: string;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop";

/**
 * Validates coordinates to ensure they are within realistic bounds.
 * Falls back to 0,0 if invalid.
 */
function validateCoordinates(coords: any): { lat: number; lng: number } {
  const lat = parseFloat(coords?.lat);
  const lng = parseFloat(coords?.lng);
  
  if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
    return { lat: 0, lng: 0 };
  }
  
  // Basic global bounds check
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { lat: 0, lng: 0 };
  }
  
  return { lat, lng };
}

/**
 * Validates and sanitizes image URLs.
 * If broken, it attempts a contextual query or falls back to a global image.
 */

/**
 * Maps raw place data into a standardized ExplorerPoint.
 * This is the central normalization hub.
 */
export function normalizePlaceData(
  raw: any, 
  index: number, 
  type: 'attraction' | 'activity' | 'stay',
  destination: string,
  heroImage?: string
): ExplorerPoint {
  const name = raw.name || "Unnamed Location";
  const sanitizedName = name.replace(/\s+/g, '-').toLowerCase();
  
  return {
    id: `${type}-${index}-${sanitizedName}`,
    name,
    description: raw.description || raw.about || `Explore the beauty and culture of ${name} in ${destination}.`,
    category: raw.category || (type === 'stay' ? 'Accommodation' : type === 'activity' ? 'Experience' : 'Landmark'),
    image: safeImageResolver(raw.image, `${destination} ${name}`, heroImage),
    rating: parseFloat(raw.rating) || 4.5,
    duration: raw.duration || (type === 'stay' ? 'Per Night' : '2-3 Hours'),
    type,
    coordinates: validateCoordinates(raw.coordinates),
    tags: Array.isArray(raw.tags) ? raw.tags : Array.isArray(raw.bestFor) ? raw.bestFor : [],
    bestTime: raw.bestTime || "Anytime"
  };
}

/**
 * Normalizes an entire destination guide into a list of explorable points.
 */
export function normalizeExplorerPoints(guide: DestinationGuideData | null | any, destination: string): ExplorerPoint[] {
  if (!guide) return [];

  const points: ExplorerPoint[] = [];
  const heroImage = (guide as any).heroImage;

  // 1. Popular Places (Attractions)
  if (Array.isArray(guide.popularPlaces)) {
    guide.popularPlaces.forEach((p: any, i: number) => points.push(normalizePlaceData(p, i, 'attraction', destination, heroImage)));
  }

  // 2. Activities
  if (Array.isArray(guide.activities)) {
    guide.activities.forEach((a: any, i: number) => points.push(normalizePlaceData(a, i, 'activity', destination, heroImage)));
  }

  // 3. Stays
  if (Array.isArray(guide.hotels)) {
    guide.hotels.forEach((h: any, i: number) => points.push(normalizePlaceData(h, i, 'stay', destination, heroImage)));
  }

  // Deduplicate by name to prevent visual clutter
  const uniquePoints: ExplorerPoint[] = [];
  const seen = new Set<string>();
  
  points.forEach(p => {
    if (!p.name) return;
    const key = p.name.toLowerCase().trim();
    if (!seen.has(key)) {
      seen.add(key);
      uniquePoints.push(p);
    }
  });

  return uniquePoints;
}

/**
 * Returns validated explorer points without padding fake data.
 * 
 * Philosophy: It's better to show 5 real places from AI/Google Places
 * than to pad with 10 that include generic fakes like "City Center Market".
 * If we have zero points, return an empty array and let the UI handle it gracefully.
 */
export function getSafeExplorerPoints(points: ExplorerPoint[], destination: string): ExplorerPoint[] {
  // Filter out any points with clearly generic/placeholder names
  const genericNames = [
    'city center market', 'grand cathedral', 'scenic lookout', 'riverside walk',
    'heritage walk', 'unnamed location', 'city center'
  ];

  const filtered = points.filter(p => {
    const nameLower = p.name?.toLowerCase().trim() || '';
    // Reject clearly generic names
    if (genericNames.includes(nameLower)) return false;
    // Reject names that are just "${destination} Hotel" or "${destination} Market"
    if (nameLower === `${destination.toLowerCase()} hotel`) return false;
    if (nameLower === `${destination.toLowerCase()} market`) return false;
    return true;
  });

  // Cap at 15 max to keep the UI manageable
  return filtered.slice(0, 15);
}

/**
 * Maps a list of explorer points to markers for a map library.
 */
export function mapPointsToMarkers(points: ExplorerPoint[]) {
  return points
    .filter(p => p.coordinates.lat !== 0)
    .map(p => ({
      id: p.id,
      title: p.name,
      position: p.coordinates,
      type: p.type
    }));
}
