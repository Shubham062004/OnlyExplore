'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function UnsplashTestPage() {
  return (
    <TestDetailPage
      title="Unsplash Images"
      category="Media & Images"
      description="Primary high-resolution imagery provider for destination hero banners, landmarks, cafes, and hotels."
      apiEndpoint="/api/test/unsplash"
      requiredEnvVars={[
        {
          name: 'UNSPLASH_ACCESS_KEY',
          description: 'Secret Unsplash application Access Key.',
          serverOnly: true,
        },
        {
          name: 'NEXT_PUBLIC_UNSPLASH_ACCESS_KEY',
          description: 'Client-side access key fallback.',
          serverOnly: false,
        },
      ]}
      howItWorks="Queried by ImageService using contextual queries (e.g. 'Shimla landscape', 'Solang Valley adventure'). Results are cached in MongoDB and forwarded to Cloudinary CDN for optimization."
      fixGuide={{
        portalName: 'Unsplash Developers',
        portalUrl: 'https://unsplash.com/developers',
        steps: [
          'Register as a developer on Unsplash.',
          'Create a "New Application" and accept developer guidelines.',
          'Copy your "Access Key" from the application dashboard.',
          'Set UNSPLASH_ACCESS_KEY=your_key in .env.',
          'Note: Free demo applications are limited to 50 requests/hour.',
        ],
      }}
    />
  );
}
