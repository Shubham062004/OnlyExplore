import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const apiKey = process.env.GOOGLE_API_KEY;

  const envStatus = [
    {
      name: 'GOOGLE_API_KEY',
      configured: !!process.env.GOOGLE_API_KEY,
      maskedValue: maskSecret(process.env.GOOGLE_API_KEY),
      required: true,
      description: 'Google Cloud API key with Places API enabled.',
    },
  ];

  if (!apiKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Google Places API',
      category: 'Maps & Location',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'GOOGLE_API_KEY is not configured in environment.',
      envStatus,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Missing GOOGLE_API_KEY for Google Places API',
        category: 'CONFIGURATION',
        likelyCause: 'GOOGLE_API_KEY is not set in .env or .env.local',
        fixSteps: [
          'Enable "Places API" in Google Cloud Console',
          'Create an API Key and set GOOGLE_API_KEY in .env',
          'Restart the development server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    const query = 'Shimla, India';
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    const placesRes = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const duration = Math.round(performance.now() - start);

    const data = await placesRes.json().catch(() => ({}));
    const status = data.status || placesRes.statusText;

    if (status !== 'OK' && status !== 'ZERO_RESULTS') {
      let category: any = 'PROVIDER_ERROR';
      let likelyCause = `Google Places API returned status: ${status}`;
      const fixSteps: string[] = [];

      if (status === 'REQUEST_DENIED') {
        category = 'PERMISSION';
        likelyCause = data.error_message || 'API key is invalid, Places API is not enabled, or IP/referrer restrictions block this request.';
        fixSteps.push('Verify Places API is enabled in Google Cloud Console');
        fixSteps.push('Check API Key restrictions (IP or HTTP Referrer restrictions may block server-side calls)');
        fixSteps.push('Ensure billing is enabled for your Google Cloud Project');
      } else if (status === 'OVER_QUERY_LIMIT') {
        category = 'QUOTA';
        likelyCause = 'Google Places API quota exceeded or billing is not enabled.';
        fixSteps.push('Check billing status on Google Cloud');
        fixSteps.push('Request quota increase if limit is exhausted');
      }

      const res: NormalizedTestResult = {
        success: false,
        service: 'Google Places API',
        category: 'Maps & Location',
        configured: true,
        authenticated: status !== 'REQUEST_DENIED',
        reachable: true,
        httpStatus: placesRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `Places API status: ${status} (${data.error_message || 'No extra message'})`,
        envStatus,
        error: {
          code: status,
          message: sanitizeError(data.error_message || status),
          category,
          likelyCause,
          fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const firstPlace = data.results?.[0];
    const res: NormalizedTestResult = {
      success: true,
      service: 'Google Places API',
      category: 'Maps & Location',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Successfully queried Google Places. Found "${firstPlace?.name || 'results'}".`,
      envStatus,
      data: {
        query,
        status: data.status,
        resultsCount: data.results?.length || 0,
        samplePlace: firstPlace
          ? {
              name: firstPlace.name,
              formattedAddress: firstPlace.formatted_address,
              coordinates: firstPlace.geometry?.location,
              placeId: firstPlace.place_id,
              rating: firstPlace.rating,
              userRatingsTotal: firstPlace.user_ratings_total,
              types: firstPlace.types,
            }
          : null,
      },
      capabilities: {
        textSearch: 'supported',
        placeDetails: 'supported',
        placePhotos: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'Google Places API');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Google Places API',
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
