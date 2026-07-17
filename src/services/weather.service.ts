import { cacheService } from './cache.service';

export interface WeatherForecast {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  forecast7Days: any[];
}

export class WeatherService {
  static async getWeatherForDestination(
    destination: string,
    coordinates?: { lat: number; lng: number }
  ): Promise<WeatherForecast | null> {
    const cacheKey = `weather:${destination.toLowerCase().trim()}`;
    
    // 1. Check Redis cache
    const cachedWeather = await cacheService.get<WeatherForecast>(cacheKey);
    if (cachedWeather) {
      console.log(`[WeatherService] Cache hit for "${destination}"`);
      return cachedWeather;
    }

    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn("OPENWEATHER_API_KEY is not set.");
      return null;
    }

    try {
      let res;
      if (coordinates) {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${apiKey}&units=metric`;
        res = await fetch(url);
      }

      if (!res || !res.ok) {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)}&appid=${apiKey}&units=metric`;
        res = await fetch(url);
      }

      if (!res.ok) {
        const cleanName = destination
          .replace(/\b(monsoon|winter|summer|trip|tour|vacation|holiday|package[s]?|general|couple|family|solo|luxury|adventure|valley|lake|park|hills|mountains?|beach)\b/gi, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleanName && cleanName.toLowerCase() !== destination.toLowerCase()) {
          console.log(`[WeatherService] Retrying weather fetch for cleaned name: "${cleanName}"`);
          const fallbackUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cleanName)}&appid=${apiKey}&units=metric`;
          res = await fetch(fallbackUrl);
        }
      }

      if (!res.ok) {
        throw new Error(`OpenWeather API error: ${res.statusText}`);
      }
      const data = await res.json();
      
      const forecast: WeatherForecast = {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
        rainProbability: data.clouds?.all || 0, // Using cloud coverage as rough rain estimate
        forecast7Days: [],
      };

      // 2. Save in cache for 15 minutes (900 seconds)
      await cacheService.set(cacheKey, forecast, 15 * 60);
      return forecast;
    } catch (error) {
      console.error("[WeatherService] Failed to fetch weather forecast:", error);
      return null;
    }
  }
}
export default WeatherService;
