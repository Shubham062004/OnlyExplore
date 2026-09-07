'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function PexelsTestPage() {
  return (
    <TestDetailPage
      title="Pexels Media"
      category="Media & Images"
      description="Fallback and supplementary image provider delivering curated landscape photography for destination guides."
      apiEndpoint="/api/test/pexels"
      requiredEnvVars={[
        {
          name: 'PEXELS_API_KEY',
          description: 'Pexels REST API authorization key.',
          serverOnly: true,
        },
      ]}
      howItWorks="Used when Unsplash API reaches hourly rate limits or lacks scenic coverage. Pexels offers 200 requests/hour free tier with landscape-oriented assets."
      fixGuide={{
        portalName: 'Pexels Developers',
        portalUrl: 'https://www.pexels.com/api/',
        steps: [
          'Create a free account on Pexels.',
          'Request an API Key under Account Settings > API.',
          'Describe your application (OnlyExplore Travel Guide).',
          'Copy your API Key and add PEXELS_API_KEY=your_key in .env.',
        ],
      }}
    />
  );
}
