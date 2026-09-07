'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function OpenRouteTestPage() {
  return (
    <TestDetailPage
      title="OpenRouteService"
      category="Maps & Location"
      description="Geospatial directions and isochrone engine providing open road routing alternatives."
      apiEndpoint="/api/test/openroute"
      requiredEnvVars={[
        {
          name: 'OPENROUTE_API_KEY',
          description: 'OpenRouteService API token for directions and isochrones.',
          serverOnly: true,
        },
      ]}
      howItWorks="Used as an open routing alternative to Mapbox for generating driving distances and travel polygons for trip itineraries."
      fixGuide={{
        portalName: 'OpenRouteService Dev Center',
        portalUrl: 'https://openrouteservice.org/dev/#/signup',
        steps: [
          'Create an account at openrouteservice.org.',
          'Request a free Standard API key.',
          'Add OPENROUTE_API_KEY=your_key in .env.',
          'Restart your local development server.',
        ],
      }}
    />
  );
}
