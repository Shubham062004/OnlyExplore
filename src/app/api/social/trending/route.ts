import { NextRequest, NextResponse } from 'next/server';
import { getTrendingSocialContent } from '@/services/social/socialService';
import { applyRateLimit } from '@/lib/rateLimit';
import { metrics } from '@/lib/metrics';

/**
 * GET /api/social/trending?destination=Amritsar
 *
 * Returns trending social content for a destination.
 * Rate limited to prevent abuse of upstream provider APIs.
 *
 * Response: SocialPulseResponse
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();

  // ── Rate Limiting ───────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rateLimitResult = applyRateLimit(`social:trending:${ip}`);
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

  if (!destination || destination.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: 'destination query parameter is required' },
      { status: 400 }
    );
  }

  // Sanitize: limit length, strip suspicious characters
  const sanitized = destination
    .trim()
    .slice(0, 100)
    .replace(/[<>{}|\\^`]/g, '');

  if (sanitized.length < 2) {
    return NextResponse.json(
      { success: false, error: 'destination must be at least 2 characters' },
      { status: 400 }
    );
  }

  // ── Fetch Social Pulse ──────────────────────────────────────────────────
  try {
    const response = await getTrendingSocialContent(sanitized);

    metrics.trackApiDuration('/api/social/trending', Date.now() - startTime);

    return NextResponse.json(response, {
      status: response.success ? 200 : 500,
      headers: {
        'Cache-Control': `public, s-maxage=${response.ttlSeconds}, stale-while-revalidate=${response.ttlSeconds * 2}`,
      },
    });
  } catch (error: any) {
    console.error('[API] Social trending error:', error);
    metrics.trackApiDuration('/api/social/trending', Date.now() - startTime);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while fetching social content',
      },
      { status: 500 }
    );
  }
}
