import { safeImageResolver } from './imageUtils';
import type { DestinationGuideData } from '@/ai/flows/generateDestinationGuide';

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
 * Supplemental curated fallbacks for major destinations.
 */
const DESTINATION_FALLBACKS: Record<string, Partial<ExplorerPoint>[]> = {
  'manali': [
    { name: 'Vashisht Temple', description: 'Famous for its hot springs and wood carvings.', category: 'Spiritual', coordinates: { lat: 32.2612, lng: 77.1874 }, tags: ['Temple', 'Hot Springs'] },
    { name: 'Manu Temple', description: 'A peaceful pagoda-style temple in Old Manali.', category: 'Culture', coordinates: { lat: 32.2570, lng: 77.1738 }, tags: ['Heritage', 'Quiet'] },
    { name: 'Beas River Bank', description: 'Stunning crystal clear water and mountain views.', category: 'Nature', coordinates: { lat: 32.2396, lng: 77.1887 }, tags: ['River', 'Views'] },
    { name: 'Museum of Himachal Culture', description: 'Exhibits on local life and heritage.', category: 'Culture', coordinates: { lat: 32.2475, lng: 77.1775 }, tags: ['Education', 'History'] },
  ],
  'default': [
    { name: 'City Center Market', description: 'The bustling heart of the local scene.', category: 'Food & Shopping', tags: ['Local', 'Vibrant'] },
    { name: 'Grand Cathedral', description: 'An iconic architectural marvel.', category: 'Heritage', tags: ['Architecture', 'History'] },
    { name: 'Scenic Lookout', description: 'Breathtaking panoramic views of the city.', category: 'Scenic Point', tags: ['Views', 'Photos'] },
    { name: 'Riverside Walk', description: 'A peaceful stroll along the water.', category: 'Nature', tags: ['Outdoor', 'Relaxing'] },
  ]
};

/**
 * The "safePlaceGeneration" system.
 * Hierarchy: AI Data -> Destination Specific Fallbacks -> Generic Fallbacks.
 */
export function getSafeExplorerPoints(points: ExplorerPoint[], destination: string): ExplorerPoint[] {
  const targetCount = 10;
  if (points.length >= targetCount) return points.slice(0, 12);

  const destKey = destination.toLowerCase().includes('manali') ? 'manali' : 'default';
  const fallbacks = DESTINATION_FALLBACKS[destKey] || DESTINATION_FALLBACKS['default'];
  
  const combined = [...points];
  
  fallbacks.forEach((fb, i) => {
    if (combined.length >= targetCount) return;
    if (!fb.name) return;
    
    // Check if name already exists in points
    const exists = combined.some(p => p.name?.toLowerCase() === fb.name?.toLowerCase());
    if (!exists) {
      combined.push(normalizePlaceData(fb, combined.length + i, 'attraction', destination));
    }
  });

  return combined;
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
