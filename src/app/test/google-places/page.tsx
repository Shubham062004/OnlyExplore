'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function GooglePlacesTestPage() {
  return (
    <TestDetailPage
      title="Google Places API"
      category="Maps & Location"
      description="Fetches verified place coordinates, ratings, business hours, and addresses for attractions and restaurants."
      apiEndpoint="/api/test/google-places"
      requiredEnvVars={[
        {
          name: 'GOOGLE_API_KEY',
          description: 'Google Cloud API Key with Places API (New or Text Search) enabled.',
          serverOnly: true,
        },
      ]}
      howItWorks="Used in PlacesService to query real businesses and sightseeing landmarks around a destination. Caches place results in Redis for 15-30 minutes."
      fixGuide={{
        portalName: 'Google Cloud Console',
        portalUrl: 'https://console.cloud.google.com/apis/library/places-backend.googleapis.com',
        steps: [
          'Open Google Cloud Console > "APIs & Services" > "Library".',
          'Search for "Places API" and click "Enable".',
          'Ensure your project has an active Billing Account linked.',
          'Verify key restrictions do not block server-side calls from IP or referrer.',
          'Add GOOGLE_API_KEY to your .env file.',
        ],
      }}
    />
  );
}
