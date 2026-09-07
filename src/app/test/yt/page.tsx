'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function YouTubeTestPage() {
  return (
    <TestDetailPage
      title="YouTube Data API v3"
      category="Social Media"
      description="Official YouTube Data API v3 integration for travel video discovery, destination highlights, and visual guides."
      apiEndpoint="/api/test/youtube"
      requiredEnvVars={[
        {
          name: 'YOUTUBE_API_KEY',
          description: 'Dedicated API key with YouTube Data API v3 scope enabled.',
          serverOnly: true,
        },
        {
          name: 'GOOGLE_API_KEY',
          description: 'Fallback Google Cloud API key if YOUTUBE_API_KEY is omitted.',
          serverOnly: true,
        },
      ]}
      howItWorks="Used in OnlyExplore Social Pulse and destination guides to search for verified travel vlogs, aerial drone shots, and authentic local food tours. Consumes ~100 quota units per search."
      fixGuide={{
        portalName: 'Google Cloud Console',
        portalUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
        steps: [
          'Log in to Google Cloud Console and select your project.',
          'Navigate to "APIs & Services" > "Library" and enable "YouTube Data API v3".',
          'Go to "Credentials" and create an API Key.',
          'Under API restrictions, select "Restrict key" and choose "YouTube Data API v3".',
          'Add YOUTUBE_API_KEY or GOOGLE_API_KEY to your .env file.',
        ],
      }}
    />
  );
}
