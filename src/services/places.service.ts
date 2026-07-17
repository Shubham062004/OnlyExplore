import { cacheService } from './cache.service';

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

export interface RealPlace {
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  coordinates: { lat: number; lng: number };
  photoReference?: string;
  types: string[];
  businessStatus?: string;
  placeId: string;
}

export class PlacesService {
  static async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<RealPlace[]> {
    if (!GOOGLE_API_KEY) return [];

    const normQuery = query.toLowerCase().trim();
    let cacheKey = `search:${normQuery}`;
    let ttlSeconds = 15 * 60; // 15 mins search results default

    if (normQuery.includes('hotel') || normQuery.includes('stay') || normQuery.includes('resort')) {
      cacheKey = `hotels:${normQuery}`;
      ttlSeconds = 30 * 60; // 30 mins Hotels
    } else if (normQuery.includes('restaurant') || normQuery.includes('cafe') || normQuery.includes('food') || normQuery.includes('bar')) {
      cacheKey = `restaurants:${normQuery}`;
      ttlSeconds = 30 * 60; // 30 mins Restaurants
    }

    const cached = await cacheService.get<RealPlace[]>(cacheKey);
    if (cached) {
      console.log(`[PlacesService] Cache hit for query "${query}"`);
      return cached;
    }

    try {
      let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      if (location) {
        url += `&location=${location.lat},${location.lng}&radius=10000`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== 'OK') return [];

      const results = data.results.map((r: any) => ({
        name: r.name,
        address: r.formatted_address,
        rating: r.rating || 0,
        userRatingsTotal: r.user_ratings_total || 0,
        coordinates: r.geometry.location,
        photoReference: r.photos?.[0]?.photo_reference,
        types: r.types || [],
        businessStatus: r.business_status,
        placeId: r.place_id,
      }));

      await cacheService.set(cacheKey, results, ttlSeconds);
      return results;
    } catch (error) {
      console.error("[PlacesService] Google Places Search Error:", error);
      return [];
    }
  }

  static async fetchNearby(location: { lat: number; lng: number }, type: string = 'cafe', radius: number = 2000): Promise<RealPlace[]> {
    if (!GOOGLE_API_KEY) return [];

    const cacheKey = `nearby:${location.lat.toFixed(4)},${location.lng.toFixed(4)}:${type}:${radius}`;
    const cached = await cacheService.get<RealPlace[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${type}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== 'OK') return [];

      const results = data.results.map((r: any) => ({
        name: r.name,
        address: r.vicinity,
        rating: r.rating || 0,
        userRatingsTotal: r.user_ratings_total || 0,
        coordinates: r.geometry.location,
        photoReference: r.photos?.[0]?.photo_reference,
        types: r.types || [],
        businessStatus: r.business_status,
        placeId: r.place_id,
        priceLevel: r.price_level,
      }));

      await cacheService.set(cacheKey, results, 30 * 60); // Cache nearby for 30 minutes
      return results;
    } catch (error) {
      console.error("[PlacesService] Nearby Search Error:", error);
      return [];
    }
  }

  static async getPlaceDetails(placeId: string) {
    if (!GOOGLE_API_KEY) return null;

    const cacheKey = `placedetails:${placeId}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_phone_number,review,website,opening_hours,price_level&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== 'OK') return null;

      const details = {
        reviews: data.result.reviews?.map((r: any) => r.text).slice(0, 3) || [],
        phone: data.result.formatted_phone_number,
        website: data.result.website,
        isOpen: data.result.opening_hours?.open_now,
        priceLevel: data.result.price_level,
      };

      await cacheService.set(cacheKey, details, 30 * 24 * 60 * 60); // 30 days
      return details;
    } catch (error) {
      console.error("[PlacesService] Place Details Error:", error);
      return null;
    }
  }

  static async getTravelInfo(origin: string, destination: string, mode: 'driving' | 'walking' | 'bicycling' = 'driving') {
    if (!GOOGLE_API_KEY) return null;

    const cacheKey = `travelinfo:${origin.toLowerCase().trim()}:${destination.toLowerCase().trim()}:${mode}`;
    const cached = await cacheService.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&mode=${mode}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
        const info = {
          distance: data.rows[0].elements[0].distance.text,
          duration: data.rows[0].elements[0].duration.text,
          durationSeconds: data.rows[0].elements[0].duration.value
        };
        await cacheService.set(cacheKey, info, 30 * 24 * 60 * 60); // 30 days
        return info;
      }
      return null;
    } catch (error) {
      console.error("[PlacesService] Distance Matrix Error:", error);
      return null;
    }
  }

  static async optimizeItineraryDays(places: RealPlace[], days: number): Promise<RealPlace[][]> {
    if (places.length === 0) return [];
    const clusters: RealPlace[][] = Array.from({ length: days }, () => []);
    const seeds: RealPlace[] = [places[0]];

    for (let i = 1; i < days; i++) {
      let maxDist = -1;
      let nextSeed = places[0];
      
      places.forEach(p => {
        let minDistToSeed = Math.min(...seeds.map(s => this.haversine(p.coordinates, s.coordinates)));
        if (minDistToSeed > maxDist) {
          maxDist = minDistToSeed;
          nextSeed = p;
        }
      });
      seeds.push(nextSeed);
    }

    places.forEach(p => {
      let minDist = Infinity;
      let clusterIndex = 0;
      
      seeds.forEach((s, idx) => {
        const dist = this.haversine(p.coordinates, s.coordinates);
        if (dist < minDist) {
          minDist = dist;
          clusterIndex = idx;
        }
      });
      clusters[clusterIndex].push(p);
    });

    return clusters;
  }

  static haversine(c1: { lat: number, lng: number }, c2: { lat: number, lng: number }) {
    const R = 6371; // Earth radius in km
    const dLat = (c2.lat - c1.lat) * Math.PI / 180;
    const dLng = (c2.lng - c1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(c1.lat * Math.PI / 180) * Math.cos(c2.lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
export default PlacesService;
