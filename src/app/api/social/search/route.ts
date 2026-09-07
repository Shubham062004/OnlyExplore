import { NextRequest, NextResponse } from 'next/server';
import { searchSocialContent } from '@/services/social/socialService';
import { applyRateLimit } from '@/lib/rateLimit';
import { metrics } from '@/lib/metrics';

/**
 * GET /api/social/search?destination=Amritsar&q=golden-temple
 *
 * Searches for specific social content within a destination context.
 * Rate limited to prevent abuse of upstream provider APIs.
 *
 * Response: SocialPulseResponse
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // ── Rate Limiting ───────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = applyRateLimit(`social:search:${ip}`);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limited. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.remainingTime || 60000) / 1000),
      },
      { status: 429 }
    );
  }

  // ── Input Validation ────────────────────────────────────────────────────
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination');
  const query = searchParams.get('q') || searchParams.get('query');

  if (!destination || destination.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'destination query parameter is required' },
      { status: 400 }
    );
  }

  if (!query || query.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'q (query) parameter is required' },
      { status: 400 }
    );
  }

  // Sanitize inputs
  const sanitizedDest = destination.trim().slice(0, 100).replace(/[<>{}|\\^`]/g, '');
  const sanitizedQuery = query.trim().slice(0, 200).replace(/[<>{}|\\^`]/g, '');

  if (sanitizedDest.length < 2 || sanitizedQuery.length < 2) {
    return NextResponse.json(
      { success: false, error: 'Parameters must be at least 2 characters' },
      { status: 400 }
    );
  }

  // ── Fetch Social Content ────────────────────────────────────────────────
  try {
    const response = await searchSocialContent(sanitizedDest, sanitizedQuery);

    metrics.trackApiDuration('/api/social/search', Date.now() - startTime);

    return NextResponse.json(response, {
      status: response.success ? 200 : 500,
      headers: {
        'Cache-Control': `public, s-maxage=${response.ttlSeconds}, stale-while-revalidate=${response.ttlSeconds * 2}`,
      },
    });
  } catch (error: any) {
    console.error('[API] Social search error:', error);
    metrics.trackApiDuration('/api/social/search', Date.now() - startTime);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while searching social content',
      },
      { status: 500 }
    );
  }
}
