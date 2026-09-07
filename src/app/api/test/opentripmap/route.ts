import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const apiKey = process.env.OPENTRIPMAP_API_KEY;

  const envStatus = [
    {
      name: 'OPENTRIPMAP_API_KEY',
      configured: !!apiKey,
      maskedValue: maskSecret(apiKey),
      required: true,
      description: 'OpenTripMap API Key for tourism attraction and POI data.',
    },
  ];

  if (!apiKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'OpenTripMap',
      category: 'Maps & Location',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'OPENTRIPMAP_API_KEY is not configured.',
      envStatus,
      error: {
        code: 'MISSING_API_KEY',
        message: 'OpenTripMap API key missing',
        category: 'CONFIGURATION',
        likelyCause: 'OPENTRIPMAP_API_KEY is not defined in .env',
        fixSteps: [
          'Create an account at https://opentripmap.io/product',
          'Copy your API key from the dashboard',
          'Add OPENTRIPMAP_API_KEY=your_key to .env',
          'Restart the Next.js server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    const place = 'Shimla';
    const url = `https://api.opentripmap.com/0.1/en/places/geoname?name=${encodeURIComponent(place)}&apikey=${apiKey}`;
    const otmRes = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const duration = Math.round(performance.now() - start);

    if (!otmRes.ok) {
      const errJson = await otmRes.json().catch(() => ({}));
      const errMsg = errJson?.error || otmRes.statusText;
      const classification = classifyError(otmRes.status, errMsg, 'OpenTripMap');

      const res: NormalizedTestResult = {
        success: false,
        service: 'OpenTripMap',
        category: 'Maps & Location',
        configured: true,
        authenticated: otmRes.status !== 401 && otmRes.status !== 403,
        reachable: true,
        httpStatus: otmRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `OpenTripMap error: HTTP ${otmRes.status} (${errMsg})`,
        envStatus,
        error: {
          code: String(otmRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await otmRes.json();

    const res: NormalizedTestResult = {
      success: true,
      service: 'OpenTripMap',
      category: 'Maps & Location',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `OpenTripMap geoname verified for ${data.name || place} (Lat: ${data.lat}, Lon: ${data.lon}).`,
      envStatus,
      data: {
        name: data.name,
        country: data.country,
        lat: data.lat,
        lon: data.lon,
        population: data.population,
        timezone: data.timezone,
      },
      capabilities: {
        geonameSearch: 'supported',
        poiSearch: 'supported',
        placesAutosuggest: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'OpenTripMap');

    const res: NormalizedTestResult = {
      success: false,
      service: 'OpenTripMap',
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
