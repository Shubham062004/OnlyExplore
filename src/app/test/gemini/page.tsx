'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function GeminiTestPage() {
  return (
    <TestDetailPage
      title="Google Gemini AI"
      category="AI & Intelligence"
      description="Powers intelligent AI travel planning, Genkit flow execution, and itinerary generation using gemini-2.5-flash."
      apiEndpoint="/api/test/gemini"
      requiredEnvVars={[
        {
          name: 'GOOGLE_API_KEY',
          description: 'Primary Google AI Studio / Cloud API key used by Genkit.',
          serverOnly: true,
        },
        {
          name: 'GEMINI_API_KEY',
          description: 'Alternative Gemini API key alias.',
          serverOnly: true,
        },
      ]}
      howItWorks="Orchestrates structured destination guides, day-by-day customized travel itineraries, interactive chat assistance, and dynamic travel suggestions across OnlyExplore."
      fixGuide={{
        portalName: 'Google AI Studio',
        portalUrl: 'https://aistudio.google.com/app/apikey',
        steps: [
          'Visit Google AI Studio and sign in with your Google account.',
          'Click "Create API key" in a new or existing Google Cloud project.',
          'Copy the generated key.',
          'Add GOOGLE_API_KEY=your_key in .env.',
          'Restart your Next.js development server.',
        ],
      }}
    />
  );
}
