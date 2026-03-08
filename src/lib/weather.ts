import { z } from 'zod';

export interface WeatherForecast {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  forecast7Days: any[];
}

export async function getWeatherForDestination(destination: string): Promise<WeatherForecast | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn("OPENWEATHER_API_KEY is not set.");
    return null;
  }

  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)}&appid=${apiKey}&units=metric`);
    if (!res.ok) {
      throw new Error(`OpenWeather API error: ${res.statusText}`);
    }
    const data = await res.json();
    
    // OpenWeather map basic endpoint does not easily offer daily_chance_of_rain in standard free /weather.
    // It provides rain 1h / 3h blocks. We fallback to general data for now.
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
      rainProbability: data.clouds?.all || 0, // Using cloud coverage as rough rain estimate substitute for basic free tier.
      forecast7Days: [], // OWM basic API `/weather` does not include 7-day. Left empty unless OneCall API is explicitly provided.
    };
  } catch (error) {
    console.error("Failed to fetch weather forecast via OpenWeatherMap:", error);
    return null;
  }
}

