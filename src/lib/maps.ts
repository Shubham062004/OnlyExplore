export interface Coordinates {
  lat: number;
  lng: number;
}

export async function getCoordinates(location: string): Promise<Coordinates | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${token}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (error) {
    console.error("Mapbox geocoding error:", error);
  }
  return null;
}

export async function getDistance(origin: string, destination: string): Promise<number | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const originCoords = await getCoordinates(origin);
    const destCoords = await getCoordinates(destination);
    if (!originCoords || !destCoords) return null;

    const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?access_token=${token}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].distance / 1000; // to km
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

export async function getTravelTime(origin: string, destination: string): Promise<number | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const originCoords = await getCoordinates(origin);
    const destCoords = await getCoordinates(destination);
    if (!originCoords || !destCoords) return null;

    const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords.lng},${originCoords.lat};${destCoords.lng},${destCoords.lat}?access_token=${token}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return Math.round(data.routes[0].duration / 60); // to minutes
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

export function generateOfflineMapLink(destination: string, coordinates?: Coordinates): string | null {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return null;

  if (coordinates) {
    // Return a mapbox Static API URL which can be downloaded.
    return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${coordinates.lng},${coordinates.lat},12,0/800x600?access_token=${token}`;
  }
  return null;
}
