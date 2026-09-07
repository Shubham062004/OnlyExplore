import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const apiKey = process.env.PEXELS_API_KEY;

  const envStatus = [
    {
      name: 'PEXELS_API_KEY',
      configured: !!process.env.PEXELS_API_KEY,
      maskedValue: maskSecret(process.env.PEXELS_API_KEY),
      required: true,
      description: 'API key for Pexels Photo and Video Search.',
    },
  ];

  if (!apiKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Pexels API',
      category: 'Media & Images',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'PEXELS_API_KEY is not configured.',
      envStatus,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Pexels API key missing',
        category: 'CONFIGURATION',
        likelyCause: 'PEXELS_API_KEY is not defined in .env or .env.local',
        fixSteps: [
          'Register for a free account at https://www.pexels.com/api/',
          'Generate your API key',
          'Add PEXELS_API_KEY=your_key to .env',
          'Restart the Next.js server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    const query = 'Shimla';
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const pexelsRes = await fetch(url, {
      headers: { Authorization: apiKey },
      signal: AbortSignal.timeout(10000),
    });
    const duration = Math.round(performance.now() - start);

    const rateLimitRemaining = pexelsRes.headers.get('X-Ratelimit-Remaining');
    const rateLimitLimit = pexelsRes.headers.get('X-Ratelimit-Limit');

    if (!pexelsRes.ok) {
      const errJson = await pexelsRes.json().catch(() => ({}));
      const errMsg = errJson?.error || pexelsRes.statusText;
      const classification = classifyError(pexelsRes.status, errMsg, 'Pexels API');

      const res: NormalizedTestResult = {
        success: false,
        service: 'Pexels API',
        category: 'Media & Images',
        configured: true,
        authenticated: pexelsRes.status !== 401 && pexelsRes.status !== 403,
        reachable: true,
        httpStatus: pexelsRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `Pexels API returned HTTP ${pexelsRes.status}: ${errMsg}`,
        envStatus,
        error: {
          code: String(pexelsRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await pexelsRes.json();
    const photo = data.photos?.[0];

    const res: NormalizedTestResult = {
      success: true,
      service: 'Pexels API',
      category: 'Media & Images',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Pexels API call verified. (${data.total_results || 0} photos found for "${query}").`,
      envStatus,
      data: {
        query,
        totalResults: data.total_results,
        rateLimit: {
          remaining: rateLimitRemaining,
          limit: rateLimitLimit,
        },
        samplePhoto: photo
          ? {
              id: photo.id,
              photographer: photo.photographer,
              photographerUrl: photo.photographer_url,
              src: photo.src?.landscape || photo.src?.medium,
              alt: photo.alt,
            }
          : null,
      },
      capabilities: {
        photoSearch: 'supported',
        curatedPhotos: 'supported',
        videoSearch: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'Pexels API');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Pexels API',
      category: 'Media & Images',
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
