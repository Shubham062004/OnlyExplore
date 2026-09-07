'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function MongoDbTestPage() {
  return (
    <TestDetailPage
      title="MongoDB Atlas"
      category="Database & Cache"
      description="Primary database storing user authentication records, saved favorites, trips, and destination content caches."
      apiEndpoint="/api/test/mongodb"
      requiredEnvVars={[
        {
          name: 'MONGODB_URI',
          description: 'MongoDB Atlas connection string with authenticated credentials.',
          serverOnly: true,
        },
      ]}
      howItWorks="Connected via Mongoose with pooled connections and 15-second timeouts. This diagnostic page runs a non-destructive ping command and checks collection counts without writing or mutating any documents."
      fixGuide={{
        portalName: 'MongoDB Atlas Console',
        portalUrl: 'https://cloud.mongodb.com/',
        steps: [
          'Log in to your MongoDB Atlas dashboard.',
          'Go to "Database" > "Connect" > "Connect your application".',
          'Copy the SRV connection string (mongodb+srv://...).',
          'Ensure your database user credentials are correct in "Database Access".',
          'Ensure current IP address or 0.0.0.0/0 is whitelisted in "Network Access".',
          'Set MONGODB_URI in .env.',
        ],
      }}
    />
  );
}
