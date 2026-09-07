import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  const envStatus = [
    {
      name: 'MAPBOX_ACCESS_TOKEN',
      configured: !!process.env.MAPBOX_ACCESS_TOKEN,
      maskedValue: maskSecret(process.env.MAPBOX_ACCESS_TOKEN),
      required: true,
      description: 'Secret/default access token for Mapbox Geocoding & Directions.',
    },
    {
      name: 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN',
      configured: !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
      maskedValue: maskSecret(process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN),
      required: false,
      description: 'Public token for client-side Mapbox GL maps.',
    },
  ];

  if (!token || token.includes('dummy')) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Mapbox API',
      category: 'Maps & Location',
      configured: !token ? false : !token.includes('dummy'),
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: token?.includes('dummy')
        ? 'MAPBOX_ACCESS_TOKEN is currently set to a dummy build placeholder ("dummy_token_for_build").'
        : 'MAPBOX_ACCESS_TOKEN is not configured.',
      envStatus,
      error: {
        code: 'PLACEHOLDER_OR_MISSING_TOKEN',
        message: token?.includes('dummy') ? 'Dummy placeholder token detected' : 'Missing Mapbox access token',
        category: 'CONFIGURATION',
        likelyCause: 'A valid Mapbox public or secret access token has not been provided in .env',
        fixSteps: [
          'Create a free account at https://account.mapbox.com/',
          'Copy your default public access token (starts with pk.)',
          'Set MAPBOX_ACCESS_TOKEN=pk.your_token in .env',
          'Restart the Next.js server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    const location = 'Shimla, India';
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${token}&limit=1`;
    const mbRes = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const duration = Math.round(performance.now() - start);

    if (!mbRes.ok) {
      const errJson = await mbRes.json().catch(() => ({}));
      const errMsg = errJson?.message || mbRes.statusText;
      const classification = classifyError(mbRes.status, errMsg, 'Mapbox API');

      const res: NormalizedTestResult = {
        success: false,
        service: 'Mapbox API',
        category: 'Maps & Location',
        configured: true,
        authenticated: mbRes.status !== 401 && mbRes.status !== 403,
        reachable: true,
        httpStatus: mbRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `Mapbox API returned HTTP ${mbRes.status}: ${errMsg}`,
        envStatus,
        error: {
          code: String(mbRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await mbRes.json();
    const feature = data.features?.[0];
    const coords = feature?.center ? { lng: feature.center[0], lat: feature.center[1] } : null;

    const res: NormalizedTestResult = {
      success: true,
      service: 'Mapbox API',
      category: 'Maps & Location',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Mapbox Geocoding verified. Resolved "${feature?.place_name || location}".`,
      envStatus,
      data: {
        query: location,
        coordinates: coords,
        placeName: feature?.place_name,
        relevance: feature?.relevance,
      },
      capabilities: {
        geocoding: 'supported',
        directions: 'supported',
        staticMaps: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'Mapbox API');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Mapbox API',
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
