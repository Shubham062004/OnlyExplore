'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function RedisTestPage() {
  return (
    <TestDetailPage
      title="Upstash Redis / Cache"
      category="Database & Cache"
      description="Two-tier caching engine combining in-memory LRU (L0) and distributed Upstash Redis REST (L1)."
      apiEndpoint="/api/test/redis"
      requiredEnvVars={[
        {
          name: 'UPSTASH_REDIS_REST_URL',
          description: 'REST endpoint URL for Upstash Redis database.',
          serverOnly: true,
        },
        {
          name: 'UPSTASH_REDIS_REST_TOKEN',
          description: 'Bearer authorization token for Upstash Redis.',
          serverOnly: true,
        },
      ]}
      howItWorks="Reduces external API costs and latency by caching weather forecasts (15 mins), places (30 mins), and AI itineraries (24 hours). If Redis is unconfigured, OnlyExplore falls back to in-memory caching automatically."
      fixGuide={{
        portalName: 'Upstash Console',
        portalUrl: 'https://console.upstash.com/',
        steps: [
          'Create a free Redis database in the Upstash console.',
          'Under Database Details > REST API, copy UPSTASH_REDIS_REST_URL.',
          'Copy UPSTASH_REDIS_REST_TOKEN.',
          'Add both variables to .env and restart dev server.',
        ],
      }}
    />
  );
}
