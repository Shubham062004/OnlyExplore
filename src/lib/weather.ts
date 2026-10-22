import { destinationMetadata } from './destinations';

export interface WeatherForecast {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  forecast7Days: any[];
}

export async function getWeatherForDestination(
  destination: string,
  coordinates?: { lat: number; lng: number }
): Promise<WeatherForecast | null> {
  const cleanDest = destination
    .replace(/\b(plan|budget|friendly|trip|with|friends|family|honeymoon|vacation|tour|days?|luxury|best)\b/gi, '')
    .trim();
  const searchCity = cleanDest || destination;

  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (apiKey) {
    try {
      let res: Response | undefined;
      if (coordinates) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${apiKey}&units=metric`;
        res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      }

      if (!res || !res.ok) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchCity)}&appid=${apiKey}&units=metric`;
        res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      }

      if (res && res.ok) {
        const data = await res.json();
        return {
          temperature: Math.round(data.main?.temp ?? 22),
          humidity: data.main?.humidity ?? 50,
          windSpeed: Math.round((data.wind?.speed ?? 3) * 3.6),
          rainProbability: data.clouds?.all || 10,
          forecast7Days: [],
        };
      }
    } catch (error) {
      console.warn("[WeatherService] OpenWeatherMap fetch warning:", error);
    }
  }

  // Graceful fallback from centralized metadata
  const metaKey = Object.keys(destinationMetadata).find(
    (k) => searchCity.toLowerCase().includes(k) || k.includes(searchCity.toLowerCase())
  );
  const meta = metaKey ? destinationMetadata[metaKey] : null;

  return {
    temperature: meta ? Math.round((meta.temp.min + meta.temp.max) / 2) : 22,
    humidity: 55,
    windSpeed: 10,
    rainProbability: 15,
    forecast7Days: [],
  };
}


