import { z } from 'zod';

export interface WeatherForecast {
  temperature: number;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  forecast7Days: any[];
}

export async function getWeatherForecast(destination: string): Promise<WeatherForecast | null> {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    console.warn("WEATHER_API_KEY is not set.");
    return null;
  }

  try {
    const res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(destination)}&days=7`);
    if (!res.ok) {
      throw new Error(`Weather API error: ${res.statusText}`);
    }
    const data = await res.json();
    
    return {
      temperature: data.current.temp_c,
      humidity: data.current.humidity,
      windSpeed: data.current.wind_kph,
      rainProbability: data.forecast.forecastday[0]?.day?.daily_chance_of_rain || 0,
      forecast7Days: data.forecast.forecastday.map((day: any) => ({
        date: day.date,
        maxTemp: day.day.maxtemp_c,
        minTemp: day.day.mintemp_c,
        condition: day.day.condition.text,
        rainChance: day.day.daily_chance_of_rain,
      }))
    };
  } catch (error) {
    console.error("Failed to fetch weather forecast:", error);
    return null;
  }
}
