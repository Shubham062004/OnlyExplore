import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const accessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

  const envStatus = [
    {
      name: 'UNSPLASH_ACCESS_KEY',
      configured: !!process.env.UNSPLASH_ACCESS_KEY,
      maskedValue: maskSecret(process.env.UNSPLASH_ACCESS_KEY),
      required: true,
      description: 'Primary secret access key for Unsplash API.',
    },
    {
      name: 'NEXT_PUBLIC_UNSPLASH_ACCESS_KEY',
      configured: !!process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY,
      maskedValue: maskSecret(process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY),
      required: false,
      description: 'Public client-side key fallback.',
    },
  ];

  if (!accessKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Unsplash API',
      category: 'Media & Images',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'UNSPLASH_ACCESS_KEY is not configured.',
      envStatus,
      error: {
        code: 'MISSING_ACCESS_KEY',
        message: 'Unsplash Access Key is missing',
        category: 'CONFIGURATION',
        likelyCause: 'Neither UNSPLASH_ACCESS_KEY nor NEXT_PUBLIC_UNSPLASH_ACCESS_KEY is in .env',
        fixSteps: [
          'Create an account at https://unsplash.com/developers',
          'Create a new application to obtain an Access Key',
          'Add UNSPLASH_ACCESS_KEY=your_key to .env',
          'Restart the server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    const query = 'Shimla';
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${accessKey}`;
    const unsplashRes = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const duration = Math.round(performance.now() - start);

    const rateLimitRemaining = unsplashRes.headers.get('X-Ratelimit-Remaining');
    const rateLimitLimit = unsplashRes.headers.get('X-Ratelimit-Limit');

    if (!unsplashRes.ok) {
      const errJson = await unsplashRes.json().catch(() => ({}));
      const errMsg = errJson?.errors?.[0] || unsplashRes.statusText;
      const classification = classifyError(unsplashRes.status, errMsg, 'Unsplash API');

      const res: NormalizedTestResult = {
        success: false,
        service: 'Unsplash API',
        category: 'Media & Images',
        configured: true,
        authenticated: unsplashRes.status !== 401 && unsplashRes.status !== 403,
        reachable: true,
        httpStatus: unsplashRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `Unsplash API returned HTTP ${unsplashRes.status}: ${errMsg}`,
        envStatus,
        error: {
          code: String(unsplashRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await unsplashRes.json();
    const photo = data.results?.[0];

    const res: NormalizedTestResult = {
      success: true,
      service: 'Unsplash API',
      category: 'Media & Images',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Successfully fetched Unsplash photo. (${data.total || 0} total photos available for "${query}").`,
      envStatus,
      data: {
        query,
        totalPhotos: data.total,
        rateLimit: {
          remaining: rateLimitRemaining,
          limit: rateLimitLimit,
        },
        samplePhoto: photo
          ? {
              id: photo.id,
              description: photo.description || photo.alt_description,
              url: photo.urls?.small,
              photographer: photo.user?.name,
              photographerUrl: photo.user?.links?.html,
            }
          : null,
      },
      capabilities: {
        photoSearch: 'supported',
        curatedCollections: 'supported',
        rateLimitHeaders: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'Unsplash API');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Unsplash API',
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
