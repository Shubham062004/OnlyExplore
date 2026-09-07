import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';

import { GET as testYoutube } from '../youtube/route';
import { GET as testGemini } from '../gemini/route';
import { GET as testPlaces } from '../google-places/route';
import { GET as testMapbox } from '../mapbox/route';
import { GET as testUnsplash } from '../unsplash/route';
import { GET as testPexels } from '../pexels/route';
import { GET as testCloudinary } from '../cloudinary/route';
import { GET as testWeather } from '../weather/route';
import { GET as testMongodb } from '../mongodb/route';
import { GET as testRedis } from '../redis/route';
import { GET as testEmail } from '../email/route';
import { GET as testSms } from '../sms/route';
import { GET as testTurnstile } from '../turnstile/route';
import { GET as testGoogleAuth } from '../google-auth/route';
import { GET as testStripe } from '../stripe/route';
import { GET as testCurrency } from '../currency/route';
import { GET as testOpenRoute } from '../openroute/route';
import { GET as testOpenTripMap } from '../opentripmap/route';
import { GET as testInstagram } from '../instagram/route';

interface TestRunnerEntry {
  id: string;
  name: string;
  run: (req: NextRequest) => Promise<NextResponse>;
}

export async function GET(req: NextRequest) {
  const overallStart = performance.now();

  // Safe read-only tests (Email and SMS run config checks only, no messages sent)
  const testSuite: TestRunnerEntry[] = [
    { id: 'youtube', name: 'YouTube Data API v3', run: testYoutube },
    { id: 'gemini', name: 'Google Gemini AI', run: testGemini },
    {
      id: 'instagram',
      name: 'Instagram Graph API',
      run: async (r) => {
        const res = await testInstagram(new NextRequest(new URL('/api/test/instagram?action=test_auth', r.url)));
        const data = await res.json();
        const hasToken = !!process.env.INSTAGRAM_ACCESS_TOKEN;
        const normalized: NormalizedTestResult = {
          success: data.success ?? false,
          service: 'Instagram Graph API',
          category: 'Social Media',
          configured: hasToken,
          authenticated: data.ok ?? false,
          reachable: data.status !== undefined,
          httpStatus: data.status ?? (hasToken ? 200 : 400),
          responseTimeMs: data.durationMs ?? 0,
          testedAt: new Date().toISOString(),
          resultSummary: data.success
            ? 'Instagram Graph API authentication verified.'
            : (data.error || 'Instagram credentials not configured in environment.'),
          envStatus: [
            {
              name: 'INSTAGRAM_ACCESS_TOKEN',
              configured: !!process.env.INSTAGRAM_ACCESS_TOKEN,
              required: true,
              description: 'Meta Graph API User/Page Access Token',
            },
            {
              name: 'INSTAGRAM_USER_ID',
              configured: !!process.env.INSTAGRAM_USER_ID,
              required: true,
              description: 'Instagram Professional Account ID',
            },
          ],
          error: data.success ? null : {
            code: String(data.status || 'NOT_CONFIGURED'),
            message: data.error || 'Credentials not configured',
            category: 'CONFIGURATION',
            likelyCause: data.likelyCause || 'Missing Instagram Graph API token in .env',
          },
        };
        return NextResponse.json(normalized);
      },
    },
    { id: 'google-places', name: 'Google Places API', run: testPlaces },
    { id: 'mapbox', name: 'Mapbox Navigation', run: testMapbox },
    { id: 'unsplash', name: 'Unsplash Images', run: testUnsplash },
    { id: 'pexels', name: 'Pexels Media', run: testPexels },
    { id: 'cloudinary', name: 'Cloudinary CDN', run: testCloudinary },
    { id: 'weather', name: 'OpenWeather API', run: testWeather },
    { id: 'mongodb', name: 'MongoDB Atlas', run: testMongodb },
    { id: 'redis', name: 'Upstash Redis / Cache', run: testRedis },
    { id: 'email', name: 'Resend Email (Config)', run: testEmail },
    { id: 'sms', name: 'Twilio SMS (Config)', run: testSms },
    { id: 'turnstile', name: 'Cloudflare Turnstile', run: testTurnstile },
    { id: 'google-auth', name: 'Google OAuth (NextAuth)', run: testGoogleAuth },
    { id: 'stripe', name: 'Stripe Payments', run: testStripe },
    { id: 'currency', name: 'Currency Conversion', run: testCurrency },
    { id: 'openroute', name: 'OpenRouteService', run: testOpenRoute },
    { id: 'opentripmap', name: 'OpenTripMap', run: testOpenTripMap },
  ];

  // Execute in parallel with Promise.allSettled
  const results = await Promise.allSettled(
    testSuite.map(async (testItem) => {
      const itemStart = performance.now();
      try {
        const nextRes = await testItem.run(req);
        const data: NormalizedTestResult = await nextRes.json();
        return {
          id: testItem.id,
          name: testItem.name,
          status: 'fulfilled' as const,
          result: data,
        };
      } catch (err: any) {
        const duration = Math.round(performance.now() - itemStart);
        const fallback: NormalizedTestResult = {
          success: false,
          service: testItem.name,
          category: 'Unknown',
          configured: false,
          authenticated: false,
          reachable: false,
          httpStatus: 500,
          responseTimeMs: duration,
          testedAt: new Date().toISOString(),
          resultSummary: `Execution error: ${err.message}`,
          envStatus: [],
          error: {
            code: 'RUNNER_ERROR',
            message: err.message,
            category: 'UNKNOWN',
          },
        };
        return {
          id: testItem.id,
          name: testItem.name,
          status: 'rejected' as const,
          result: fallback,
        };
      }
    })
  );

  const totalDuration = Math.round(performance.now() - overallStart);

  const mappedResults: Record<string, NormalizedTestResult> = {};
  let passedCount = 0;
  let configuredCount = 0;

  results.forEach((item) => {
    if (item.status === 'fulfilled') {
      mappedResults[item.value.id] = item.value.result;
      if (item.value.result.success) passedCount++;
      if (item.value.result.configured) configuredCount++;
    }
  });

  return NextResponse.json({
    success: true,
    totalTests: testSuite.length,
    passedCount,
    configuredCount,
    totalDurationMs: totalDuration,
    timestamp: new Date().toISOString(),
    results: mappedResults,
  });
}
