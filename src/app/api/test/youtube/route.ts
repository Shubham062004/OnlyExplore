import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

  const envStatus = [
    {
      name: 'YOUTUBE_API_KEY',
      configured: !!process.env.YOUTUBE_API_KEY,
      maskedValue: maskSecret(process.env.YOUTUBE_API_KEY),
      required: false,
      description: 'Dedicated Google Cloud API key for YouTube Data API v3.',
    },
    {
      name: 'GOOGLE_API_KEY',
      configured: !!process.env.GOOGLE_API_KEY,
      maskedValue: maskSecret(process.env.GOOGLE_API_KEY),
      required: !process.env.YOUTUBE_API_KEY,
      description: 'Primary Google Cloud API key (fallback for YouTube).',
    },
  ];

  if (!apiKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'YouTube Data API v3',
      category: 'Social Media',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'Neither YOUTUBE_API_KEY nor GOOGLE_API_KEY is configured in the environment.',
      envStatus,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Missing required API key for YouTube Data API',
        category: 'CONFIGURATION',
        likelyCause: 'Neither YOUTUBE_API_KEY nor GOOGLE_API_KEY is defined in .env or .env.local',
        fixSteps: [
          'Go to Google Cloud Console (https://console.cloud.google.com)',
          'Enable "YouTube Data API v3" for your project',
          'Create an API key in Credentials',
          'Add YOUTUBE_API_KEY or GOOGLE_API_KEY to .env and restart dev server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=Shimla+travel+guide&maxResults=2&type=video&key=${apiKey}`;
    const ytRes = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const duration = Math.round(performance.now() - start);

    if (!ytRes.ok) {
      const errJson = await ytRes.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || ytRes.statusText;
      const classification = classifyError(ytRes.status, errMsg, 'YouTube Data API');

      const res: NormalizedTestResult = {
        success: false,
        service: 'YouTube Data API v3',
        category: 'Social Media',
        configured: true,
        authenticated: ytRes.status !== 401 && ytRes.status !== 403,
        reachable: true,
        httpStatus: ytRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `YouTube API returned error: HTTP ${ytRes.status}`,
        envStatus,
        error: {
          code: String(ytRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await ytRes.json();
    const items = data.items || [];
    const videos = items.map((item: any) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      channelTitle: item.snippet?.channelTitle,
      publishedAt: item.snippet?.publishedAt,
      thumbnail: item.snippet?.thumbnails?.medium?.url,
    }));

    const res: NormalizedTestResult = {
      success: true,
      service: 'YouTube Data API v3',
      category: 'Social Media',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Successfully queried YouTube Data API. Returned ${videos.length} videos.`,
      envStatus,
      data: {
        totalResults: data.pageInfo?.totalResults ?? items.length,
        resultsReturned: videos.length,
        videos,
      },
      capabilities: {
        'search.list': 'supported',
        'videos.list': 'supported',
        'embedPlayer': 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Unknown network error', 'YouTube Data API');

    const res: NormalizedTestResult = {
      success: false,
      service: 'YouTube Data API v3',
      category: 'Social Media',
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
