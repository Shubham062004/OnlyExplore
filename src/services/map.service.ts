import { cacheService } from './cache.service';

export interface Coordinates {
  lat: number;
  lng: number;
}

export class MapService {
  static async getCoordinates(location: string): Promise<Coordinates | null> {
    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (!token) return null;

    const cacheKey = `coords:${location.toLowerCase().trim()}`;
    const cached = await cacheService.get<Coordinates>(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${token}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const coords = { lat, lng };
        // Cache coordinates for 30 days
        await cacheService.set(cacheKey, coords, 30 * 24 * 60 * 60);
        return coords;
      }
    } catch (error) {
      console.error("[MapService] Mapbox geocoding error:", error);
    }
    return null;
  }

  static async getDistance(origin: string, destination: string): Promise<number | null> {
    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (!token) return null;

    try {
      const originCoords = await this.getCoordinates(origin);
      const destCoords = await this.getCoordinates(destination);
      if (!originCoords || !destCoords) return null;

      const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?access_token=${token}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].distance / 1000; // to km
      }
    } catch (e) {
      console.error("[MapService] Error in getDistance:", e);
    }
    return null;
  }

  static async getTravelTime(origin: string, destination: string): Promise<number | null> {
    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (!token) return null;

    try {
      const originCoords = await this.getCoordinates(origin);
      const destCoords = await this.getCoordinates(destination);
      if (!originCoords || !destCoords) return null;

      const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?access_token=${token}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        return Math.round(data.routes[0].duration / 60); // to minutes
      }
    } catch (e) {
      console.error("[MapService] Error in getTravelTime:", e);
    }
    return null;
  }

  static generateOfflineMapLink(destination: string, coordinates?: Coordinates): string | null {
    const token = process.env.MAPBOX_ACCESS_TOKEN;
    if (!token) return null;

    if (coordinates) {
      return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${coordinates.lng},${coordinates.lat},12,0/800x600?access_token=${token}`;
    }
    return null;
  }
}
export default MapService;
