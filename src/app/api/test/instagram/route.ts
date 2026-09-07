// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY DEV/TEST ROUTE — Instagram Graph API Capability Tester
// ─────────────────────────────────────────────────────────────────────────────
// This route exists ONLY to verify what the official Instagram Graph API can
// actually return. It is NOT a production endpoint.
//
// Remove this file once testing is complete and Social Pulse is implemented.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.instagram.com/${GRAPH_API_VERSION}`;
// Some endpoints (like ig_hashtag_search) live on the Facebook Graph API domain
const FB_GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Sanitize error messages — strip access tokens, secrets, and sensitive data */
function sanitizeError(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);

  // Redact anything that looks like an access token or secret
  return raw
    .replace(/access_token=[^\s&]+/gi, 'access_token=[REDACTED]')
    .replace(/EAA[A-Za-z0-9]+/g, '[REDACTED_TOKEN]')
    .replace(/\b[A-Fa-f0-9]{32,}\b/g, '[REDACTED_HASH]');
}

/** Sanitize a full API response object — remove any token references */
function sanitizeResponse(data: unknown): unknown {
  const json = JSON.stringify(data);
  const cleaned = json
    .replace(/EAA[A-Za-z0-9]+/g, '[REDACTED_TOKEN]')
    .replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"[REDACTED]"');
  try {
    return JSON.parse(cleaned);
  } catch {
    return cleaned;
  }
}

/** Check if env variables are configured */
function getCredentials(): {
  accessToken: string | null;
  userId: string | null;
  configured: boolean;
  missing: string[];
} {
  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || null;
  const userId = process.env.INSTAGRAM_USER_ID || null;
  const missing: string[] = [];

  if (!accessToken) missing.push('INSTAGRAM_ACCESS_TOKEN');
  if (!userId) missing.push('INSTAGRAM_USER_ID');

  return {
    accessToken,
    userId,
    configured: missing.length === 0,
    missing,
  };
}

/** Fetch from Instagram/Facebook Graph API with timing */
async function graphFetch(
  url: string,
  accessToken: string,
  timeoutMs: number = 15000
): Promise<{
  ok: boolean;
  status: number;
  data: unknown;
  durationMs: number;
  error?: string;
}> {
  const separator = url.includes('?') ? '&' : '?';
  const fullUrl = `${url}${separator}access_token=${accessToken}`;

  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(fullUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'OnlyExplore-APITester/1.0' },
    });

    clearTimeout(timeoutId);
    const durationMs = Math.round(performance.now() - start);

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      data = { raw: await response.text() };
    }

    if (!response.ok) {
      const metaError = (data as any)?.error;
      return {
        ok: false,
        status: response.status,
        data: sanitizeResponse(data),
        durationMs,
        error: metaError
          ? `Meta API Error ${metaError.code || ''}: ${metaError.message || 'Unknown'} (type: ${metaError.type || 'unknown'})`
          : `HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      status: response.status,
      data: sanitizeResponse(data),
      durationMs,
    };
  } catch (err: unknown) {
    const durationMs = Math.round(performance.now() - start);
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      data: null,
      durationMs,
      error: isAbort
        ? `Request timed out after ${timeoutMs}ms`
        : sanitizeError(err),
    };
  }
}

// ── Test Actions ─────────────────────────────────────────────────────────────

/** Test 1: Authentication & Account Info */
async function testAuth(accessToken: string) {
  const fields = [
    'id',
    'username',
    'name',
    'account_type',
    'biography',
    'followers_count',
    'follows_count',
    'media_count',
    'profile_picture_url',
    'website',
  ].join(',');

  const result = await graphFetch(
    `${GRAPH_API_BASE}/me?fields=${fields}`,
    accessToken
  );

  // Identify which fields were actually returned
  const returnedFields: string[] = [];
  if (result.ok && result.data && typeof result.data === 'object') {
    returnedFields.push(...Object.keys(result.data as Record<string, unknown>));
  }

  return {
    test: 'authentication',
    endpoint: `/me?fields=${fields}`,
    ...result,
    returnedFields,
  };
}

/** Test 2: Account Media (own content) */
async function testAccountMedia(accessToken: string, userId: string) {
  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'permalink',
    'thumbnail_url',
    'timestamp',
    'username',
    'like_count',
    'comments_count',
  ].join(',');

  const result = await graphFetch(
    `${GRAPH_API_BASE}/${userId}/media?fields=${fields}&limit=5`,
    accessToken
  );

  let mediaCount = 0;
  let mediaTypes: string[] = [];
  let returnedFields: string[] = [];
  let hasReels = false;

  if (result.ok && result.data) {
    const items = (result.data as any)?.data;
    if (Array.isArray(items)) {
      mediaCount = items.length;
      mediaTypes = [...new Set(items.map((i: any) => i.media_type).filter(Boolean))] as string[];
      hasReels = items.some((i: any) => i.media_type === 'VIDEO' || i.media_type === 'REEL');
      if (items.length > 0) {
        returnedFields = Object.keys(items[0]);
      }
    }
  }

  return {
    test: 'account_media',
    endpoint: `/${userId}/media?fields=${fields}&limit=5`,
    ...result,
    mediaCount,
    mediaTypes,
    returnedFields,
    hasReels,
  };
}

/** Test 3: Hashtag Search */
async function testHashtag(
  accessToken: string,
  userId: string,
  hashtag: string
) {
  // Step 1: Search for the hashtag ID
  const searchResult = await graphFetch(
    `${FB_GRAPH_API_BASE}/ig_hashtag_search?q=${encodeURIComponent(hashtag)}&user_id=${userId}`,
    accessToken
  );

  if (!searchResult.ok) {
    return {
      test: 'hashtag_search',
      endpoint: `/ig_hashtag_search?q=${hashtag}`,
      step: 'hashtag_id_lookup',
      ...searchResult,
      hashtagId: null,
      mediaCount: 0,
      mediaTypes: [] as string[],
      returnedFields: [] as string[],
    };
  }

  const hashtagData = (searchResult.data as any)?.data;
  if (!Array.isArray(hashtagData) || hashtagData.length === 0) {
    return {
      test: 'hashtag_search',
      endpoint: `/ig_hashtag_search?q=${hashtag}`,
      step: 'hashtag_id_lookup',
      ...searchResult,
      error: 'No hashtag ID returned',
      hashtagId: null,
      mediaCount: 0,
      mediaTypes: [] as string[],
      returnedFields: [] as string[],
    };
  }

  const hashtagId = hashtagData[0].id;

  // Step 2: Get top media for this hashtag
  const mediaFields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'permalink',
    'thumbnail_url',
    'timestamp',
    'like_count',
    'comments_count',
  ].join(',');

  const mediaResult = await graphFetch(
    `${GRAPH_API_BASE}/${hashtagId}/top_media?user_id=${userId}&fields=${mediaFields}&limit=10`,
    accessToken
  );

  let mediaCount = 0;
  let mediaTypes: string[] = [];
  let returnedFields: string[] = [];
  let hasReels = false;
  let hasLocation = false;
  let hasEngagement = false;

  if (mediaResult.ok && mediaResult.data) {
    const items = (mediaResult.data as any)?.data;
    if (Array.isArray(items)) {
      mediaCount = items.length;
      mediaTypes = [...new Set(items.map((i: any) => i.media_type).filter(Boolean))] as string[];
      hasReels = items.some((i: any) => i.media_type === 'VIDEO' || i.media_type === 'REEL');
      hasLocation = items.some((i: any) => i.location);
      hasEngagement = items.some(
        (i: any) => i.like_count !== undefined || i.comments_count !== undefined
      );
      if (items.length > 0) {
        returnedFields = Object.keys(items[0]);
      }
    }
  }

  return {
    test: 'hashtag_search',
    endpoint: `/${hashtagId}/top_media?fields=${mediaFields}`,
    step: 'top_media',
    hashtagIdLookup: {
      ok: searchResult.ok,
      status: searchResult.status,
      durationMs: searchResult.durationMs,
      hashtagId,
    },
    ...mediaResult,
    // Override durationMs to be total
    durationMs: searchResult.durationMs + mediaResult.durationMs,
    mediaCount,
    mediaTypes,
    returnedFields,
    hasReels,
    hasLocation,
    hasEngagement,
  };
}

/** Test 4: Media Details (fetch a specific media by ID) */
async function testMediaDetails(accessToken: string, mediaId: string) {
  const fields = [
    'id',
    'caption',
    'media_type',
    'media_url',
    'permalink',
    'thumbnail_url',
    'timestamp',
    'username',
    'like_count',
    'comments_count',
    'ig_id',
    'is_shared_to_feed',
    'media_product_type',
    'owner',
    'shortcode',
    'video_title',
  ].join(',');

  const result = await graphFetch(
    `${GRAPH_API_BASE}/${mediaId}?fields=${fields}`,
    accessToken
  );

  let returnedFields: string[] = [];
  let hasEngagement = false;

  if (result.ok && result.data && typeof result.data === 'object') {
    returnedFields = Object.keys(result.data as Record<string, unknown>);
    const d = result.data as any;
    hasEngagement = d.like_count !== undefined || d.comments_count !== undefined;
  }

  return {
    test: 'media_details',
    endpoint: `/${mediaId}?fields=${fields}`,
    ...result,
    returnedFields,
    hasEngagement,
  };
}

// ── Route Handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'auth';
  const query = searchParams.get('q') || 'Amritsar';
  const mediaId = searchParams.get('mediaId') || '';

  // Check credentials
  const creds = getCredentials();

  if (!creds.configured) {
    return NextResponse.json(
      {
        success: false,
        test: action,
        error: `Missing environment variables: ${creds.missing.join(', ')}`,
        likelyCause:
          'Instagram Graph API credentials are not configured. Add INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID to your .env file.',
        setup: {
          required: [
            'INSTAGRAM_ACCESS_TOKEN — User Access Token from Meta Developer Portal',
            'INSTAGRAM_USER_ID — Instagram Business/Creator Account ID',
          ],
          steps: [
            '1. Create a Meta Developer App at https://developers.facebook.com',
            '2. Add the Instagram Graph API product to your app',
            '3. Link an Instagram Business/Creator account to a Facebook Page',
            '4. Generate a User Access Token with instagram_basic permission',
            '5. Get your IG User ID via: GET /me?fields=id on the Graph API Explorer',
            '6. Add both values to your .env file',
          ],
        },
        durationMs: 0,
      },
      { status: 200 } // 200 so the client can render the diagnostic
    );
  }

  try {
    let result: unknown;

    switch (action) {
      case 'auth':
        result = await testAuth(creds.accessToken!);
        break;

      case 'account':
        result = await testAccountMedia(creds.accessToken!, creds.userId!);
        break;

      case 'hashtag':
        result = await testHashtag(creds.accessToken!, creds.userId!, query);
        break;

      case 'media':
        if (!mediaId) {
          return NextResponse.json(
            {
              success: false,
              test: 'media_details',
              error: 'Missing mediaId parameter',
              likelyCause:
                'Provide a media ID from a previous test result. Run "Test Authentication" first to get media IDs.',
              durationMs: 0,
            },
            { status: 200 }
          );
        }
        result = await testMediaDetails(creds.accessToken!, mediaId);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}. Supported: auth, account, hashtag, media`,
            durationMs: 0,
          },
          { status: 200 }
        );
    }

    return NextResponse.json({ success: true, ...(result as object) });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        test: action,
        error: sanitizeError(err),
        likelyCause: 'Unexpected server error during API test',
        durationMs: 0,
      },
      { status: 500 }
    );
  }
}
