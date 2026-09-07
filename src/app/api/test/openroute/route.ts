import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const apiKey = process.env.OPENROUTE_API_KEY;

  const envStatus = [
    {
      name: 'OPENROUTE_API_KEY',
      configured: !!apiKey,
      maskedValue: maskSecret(apiKey),
      required: true,
      description: 'OpenRouteService API token for open-source routing.',
    },
  ];

  if (!apiKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'OpenRouteService',
      category: 'Maps & Location',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'OPENROUTE_API_KEY is not configured.',
      envStatus,
      error: {
        code: 'MISSING_API_KEY',
        message: 'OpenRouteService API key missing',
        category: 'CONFIGURATION',
        likelyCause: 'OPENROUTE_API_KEY is not defined in .env',
        fixSteps: [
          'Create an account at https://openrouteservice.org/dev/#/signup',
          'Generate a token in the dashboard',
          'Add OPENROUTE_API_KEY=your_key to .env',
          'Restart the Next.js development server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    const url = 'https://api.openrouteservice.org/v2/directions/driving-car?start=8.681495,49.41461&end=8.687872,49.420318';
    const orsRes = await fetch(url, {
      headers: { Authorization: apiKey },
      signal: AbortSignal.timeout(8000),
    });
    const duration = Math.round(performance.now() - start);

    if (!orsRes.ok) {
      const errJson = await orsRes.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || errJson?.error || orsRes.statusText;
      const classification = classifyError(orsRes.status, errMsg, 'OpenRouteService');

      const res: NormalizedTestResult = {
        success: false,
        service: 'OpenRouteService',
        category: 'Maps & Location',
        configured: true,
        authenticated: orsRes.status !== 401 && orsRes.status !== 403,
        reachable: true,
        httpStatus: orsRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `OpenRouteService error: HTTP ${orsRes.status} (${errMsg})`,
        envStatus,
        error: {
          code: String(orsRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await orsRes.json().catch(() => ({}));

    const res: NormalizedTestResult = {
      success: true,
      service: 'OpenRouteService',
      category: 'Maps & Location',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: 'OpenRouteService API key verified and endpoints operational.',
      envStatus,
      data: {
        serviceStatus: data?.status || 'ready',
        serviceVersion: data?.version || 'v2',
      },
      capabilities: {
        drivingRouting: 'supported',
        walkingRouting: 'supported',
        isochrones: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'OpenRouteService');

    const res: NormalizedTestResult = {
      success: false,
      service: 'OpenRouteService',
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
