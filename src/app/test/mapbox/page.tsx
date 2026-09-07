'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function MapboxTestPage() {
  return (
    <TestDetailPage
      title="Mapbox Navigation"
      category="Maps & Location"
      description="Powers geocoding, driving route geometry, distance calculation, and interactive travel map markers."
      apiEndpoint="/api/test/mapbox"
      requiredEnvVars={[
        {
          name: 'MAPBOX_ACCESS_TOKEN',
          description: 'Secret or default access token for server-side Geocoding and Directions.',
          serverOnly: true,
        },
        {
          name: 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN',
          description: 'Client token for rendering Mapbox GL interactive map tiles.',
          serverOnly: false,
        },
      ]}
      howItWorks="Converts place names to GPS lat/lng coordinates and calculates multi-stop driving and walking routes between hotels, attractions, and cafes in MapService."
      fixGuide={{
        portalName: 'Mapbox Account Dashboard',
        portalUrl: 'https://account.mapbox.com/',
        steps: [
          'Create or log in to your Mapbox account.',
          'Under "Access tokens", copy your "Default public token" (starts with pk.).',
          'Add MAPBOX_ACCESS_TOKEN=pk.your_token in .env.',
          'Replace any placeholder like dummy_token_for_build with the genuine token.',
        ],
      }}
    />
  );
}
