'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function OpenTripMapTestPage() {
  return (
    <TestDetailPage
      title="OpenTripMap"
      category="Maps & Location"
      description="Global travel catalog providing points of interest (POI), historical landmarks, and tourism information."
      apiEndpoint="/api/test/opentripmap"
      requiredEnvVars={[
        {
          name: 'OPENTRIPMAP_API_KEY',
          description: 'OpenTripMap API token for places and geoname discovery.',
          serverOnly: true,
        },
      ]}
      howItWorks="Provides geoname details, population data, coordinates, and cultural point-of-interest catalogs for travel destinations."
      fixGuide={{
        portalName: 'OpenTripMap Dashboard',
        portalUrl: 'https://opentripmap.io/product',
        steps: [
          'Create a free account at opentripmap.io.',
          'Obtain your API Key from the dashboard.',
          'Set OPENTRIPMAP_API_KEY=your_key in .env.',
          'Restart your local development server.',
        ],
      }}
    />
  );
}
