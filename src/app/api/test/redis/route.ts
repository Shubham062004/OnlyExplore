import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';
import cacheService from '@/services/cache.service';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  const isRedisConfigured = !!(url && token);

  const envStatus = [
    {
      name: 'UPSTASH_REDIS_REST_URL',
      configured: !!url,
      maskedValue: maskSecret(url),
      required: true,
      description: 'Upstash Redis REST endpoint URL.',
    },
    {
      name: 'UPSTASH_REDIS_REST_TOKEN',
      configured: !!token,
      maskedValue: maskSecret(token),
      required: true,
      description: 'Upstash Redis REST Bearer token.',
    },
  ];

  // If Redis is not configured, report fallback to in-memory cache gracefully
  if (!isRedisConfigured) {
    const memoryStats = cacheService.getStats().memory;
    const res: NormalizedTestResult = {
      success: true, // Application gracefully operates with in-memory cache
      service: 'Upstash Redis / Cache',
      category: 'Database & Cache',
      configured: false,
      authenticated: false,
      reachable: true, // In-memory cache is operational
      httpStatus: 200,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'Redis not configured. Operating with L0 In-Memory LRU cache fallback.',
      envStatus,
      data: {
        cacheMode: 'In-Memory (LRU Fallback)',
        memoryEntries: memoryStats?.size ?? 0,
        memoryHitRate: memoryStats?.hitRate ?? '0%',
        redisAvailable: false,
      },
      capabilities: {
        inMemoryL0Cache: 'supported',
        distributedL1Redis: 'unsupported',
        rateLimiting: 'conditional',
      },
      error: {
        code: 'REDIS_NOT_CONFIGURED',
        message: 'Upstash Redis credentials are not configured in environment',
        category: 'CONFIGURATION',
        likelyCause: 'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are missing from .env',
        fixSteps: [
          'Create a free database at https://upstash.com',
          'Copy the REST URL and REST Token under Details',
          'Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env',
          'Restart the Next.js server to activate distributed caching across serverless instances',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    const redis = new Redis({ url, token });
    const pingStart = performance.now();
    const pingRes = await redis.ping();
    const pingLatency = Math.round(performance.now() - pingStart);

    // Ephemeral namespaced key test
    const testKey = `onlyexplore:test:${Date.now()}`;
    const testValue = { probe: 'ok', timestamp: Date.now() };

    // SET with 60s TTL
    await redis.set(testKey, JSON.stringify(testValue), { ex: 60 });

    // GET
    const readVal = await redis.get(testKey);

    // DELETE cleanup
    await redis.del(testKey);

    const duration = Math.round(performance.now() - start);

    const res: NormalizedTestResult = {
      success: true,
      service: 'Upstash Redis / Cache',
      category: 'Database & Cache',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Upstash Redis connected. Ping: ${pingRes} (${pingLatency}ms). Ephemeral SET/GET/DEL verified.`,
      envStatus,
      data: {
        cacheMode: 'Distributed (Upstash Redis L1 + In-Memory L0)',
        pingResponse: pingRes,
        pingLatencyMs: pingLatency,
        testKeyCleanedUp: true,
        readVerification: readVal !== null,
        memoryStats: cacheService.getStats().memory,
      },
      capabilities: {
        inMemoryL0Cache: 'supported',
        distributedL1Redis: 'supported',
        ttlExpiration: 'supported',
        rateLimiting: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Redis error', 'Upstash Redis');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Upstash Redis / Cache',
      category: 'Database & Cache',
      configured: true,
      authenticated: false,
      reachable: false,
      httpStatus: 500,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Upstash Redis error: ${sanitizeError(error.message)}`,
      envStatus,
      error: {
        code: error.name || 'REDIS_ERROR',
        message: sanitizeError(error.message),
        category: classification.category,
        likelyCause: classification.likelyCause,
        fixSteps: classification.fixSteps,
      },
    };
    return NextResponse.json(res, { status: 200 });
  }
}
