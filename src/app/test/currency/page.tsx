'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function CurrencyTestPage() {
  return (
    <TestDetailPage
      title="Currency Engine & Rates"
      category="Commerce & Financial"
      description="Utility for Indian Rupee (INR) formatting, lakhs/crores notation, budget estimation, and live USD/INR conversions."
      apiEndpoint="/api/test/currency"
      requiredEnvVars={[]}
      howItWorks="Implemented in src/lib/currency.ts. Formats amounts with Indian numbering system conventions (₹1,23,456.00 or ₹1.5 L) and converts estimated hotel/tour pricing between USD and INR."
      fixGuide={{
        portalName: 'OnlyExplore Codebase (src/lib/currency.ts)',
        portalUrl: 'https://github.com/',
        steps: [
          'Currency calculations are built into the application core.',
          'Static default exchange rate is 88.7 INR per USD.',
          'Live rates can be updated via open exchange rates APIs or periodic cache updates.',
        ],
      }}
    />
  );
}
