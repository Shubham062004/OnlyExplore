'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function WeatherTestPage() {
  return (
    <TestDetailPage
      title="OpenWeather API"
      category="Maps & Location"
      description="Fetches live temperatures, cloud cover, humidity, and weather conditions for destination pages."
      apiEndpoint="/api/test/weather"
      requiredEnvVars={[
        {
          name: 'OPENWEATHER_API_KEY',
          description: 'Primary API key from OpenWeatherMap 2.5/3.0.',
          serverOnly: true,
        },
        {
          name: 'WEATHER_API_KEY',
          description: 'Secondary weather key alias in .env.',
          serverOnly: true,
        },
      ]}
      howItWorks="Queried in WeatherService to render real-time conditions (e.g. 15°C, Light Rain) and dynamic clothing/packing suggestions. Results are cached in Redis for 15 minutes."
      fixGuide={{
        portalName: 'OpenWeather Portal',
        portalUrl: 'https://home.openweathermap.org/api_keys',
        steps: [
          'Create an account at openweathermap.org.',
          'Generate an API Key under the "API keys" tab.',
          'Copy the key into .env as OPENWEATHER_API_KEY.',
          'Important: New OpenWeather keys take up to 20-30 minutes to propagate across their cluster.',
        ],
      }}
    />
  );
}
