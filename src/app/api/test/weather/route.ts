import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const apiKey =
    process.env.OPENWEATHER_API_KEY ||
    process.env.WEATHER_API_KEY ||
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  const envStatus = [
    {
      name: 'OPENWEATHER_API_KEY',
      configured: !!process.env.OPENWEATHER_API_KEY,
      maskedValue: maskSecret(process.env.OPENWEATHER_API_KEY),
      required: true,
      description: 'Primary OpenWeatherMap API 2.5/3.0 key.',
    },
    {
      name: 'WEATHER_API_KEY',
      configured: !!process.env.WEATHER_API_KEY,
      maskedValue: maskSecret(process.env.WEATHER_API_KEY),
      required: false,
      description: 'Alternative weather key alias in .env.',
    },
  ];

  if (!apiKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'OpenWeather API',
      category: 'Maps & Location',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'OPENWEATHER_API_KEY is not configured.',
      envStatus,
      error: {
        code: 'MISSING_API_KEY',
        message: 'OpenWeather API key is missing',
        category: 'CONFIGURATION',
        likelyCause: 'Neither OPENWEATHER_API_KEY nor WEATHER_API_KEY is set in .env',
        fixSteps: [
          'Create a free account at https://openweathermap.org/',
          'Generate an API key in your account dashboard',
          'Add OPENWEATHER_API_KEY=your_key to .env',
          'Note: New OpenWeather keys can take up to 30 minutes to activate globally',
          'Restart the Next.js server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    const city = 'Shimla';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const weatherRes = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const duration = Math.round(performance.now() - start);

    if (!weatherRes.ok) {
      const errJson = await weatherRes.json().catch(() => ({}));
      const errMsg = errJson?.message || weatherRes.statusText;
      const classification = classifyError(weatherRes.status, errMsg, 'OpenWeather API');

      const res: NormalizedTestResult = {
        success: false,
        service: 'OpenWeather API',
        category: 'Maps & Location',
        configured: true,
        authenticated: weatherRes.status !== 401 && weatherRes.status !== 403,
        reachable: true,
        httpStatus: weatherRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `OpenWeather API returned HTTP ${weatherRes.status}: ${errMsg}`,
        envStatus,
        error: {
          code: String(weatherRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause:
            weatherRes.status === 401 && errMsg.includes('Invalid API key')
              ? 'Invalid API key, or newly generated key has not finished propagating (takes ~10-30 mins).'
              : classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await weatherRes.json();
    const weatherDesc = data.weather?.[0]?.description || 'Clear';
    const tempC = Math.round(data.main?.temp ?? 0);

    const res: NormalizedTestResult = {
      success: true,
      service: 'OpenWeather API',
      category: 'Maps & Location',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Weather successfully retrieved for ${data.name || city}: ${tempC}°C, ${weatherDesc}.`,
      envStatus,
      data: {
        location: `${data.name}, ${data.sys?.country}`,
        temperatureCelsius: tempC,
        feelsLikeCelsius: Math.round(data.main?.feels_like ?? 0),
        condition: weatherDesc,
        humidity: `${data.main?.humidity}%`,
        windSpeed: `${Math.round((data.wind?.speed ?? 0) * 3.6)} km/h`,
        coordinates: data.coord,
      },
      capabilities: {
        currentWeather: 'supported',
        metricUnits: 'supported',
        citySearch: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'OpenWeather API');

    const res: NormalizedTestResult = {
      success: false,
      service: 'OpenWeather API',
      category: 'Maps & Location',
      configured: true,
      authenticated: false,
      reachable: false,
      httpStatus: 500,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Connection failed: ${sanitizeError(error.message)}`,
      envStatus,
      error: {
        code: error.name || 'FETCH_ERROR',
        message: sanitizeError(error.message),
        category: classification.category,
        likelyCause: classification.likelyCause,
        fixSteps: classification.fixSteps,
      },
    };
    return NextResponse.json(res, { status: 200 });
  }
}
