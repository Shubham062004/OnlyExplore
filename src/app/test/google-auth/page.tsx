'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function GoogleAuthTestPage() {
  return (
    <TestDetailPage
      title="Google OAuth (NextAuth.js)"
      category="Authentication & Security"
      description="Single Sign-On (SSO) and JWT session management supporting Google authentication in OnlyExplore."
      apiEndpoint="/api/test/google-auth"
      requiredEnvVars={[
        {
          name: 'GOOGLE_CLIENT_ID',
          description: 'Google OAuth Client ID from Google Cloud Console.',
          serverOnly: true,
        },
        {
          name: 'GOOGLE_CLIENT_SECRET',
          description: 'Google OAuth Client Secret.',
          serverOnly: true,
        },
        {
          name: 'NEXTAUTH_SECRET',
          description: 'Encryption secret for JWT user session cookies.',
          serverOnly: true,
        },
        {
          name: 'NEXTAUTH_URL',
          description: 'Canonical origin URL for OAuth redirect URIs (e.g. http://localhost:9002).',
          serverOnly: true,
        },
      ]}
      howItWorks="Powers 1-click Google Sign-In via NextAuth GoogleProvider, storing verified email and avatar in MongoDB while issuing tamper-proof HTTP-only JWT cookies."
      fixGuide={{
        portalName: 'Google Cloud Credentials',
        portalUrl: 'https://console.cloud.google.com/apis/credentials',
        steps: [
          'Go to Google Cloud Console > "APIs & Services" > "Credentials".',
          'Create an "OAuth client ID" with type "Web application".',
          'Add Authorized JavaScript origins: http://localhost:9002.',
          'Add Authorized redirect URIs: http://localhost:9002/api/auth/callback/google.',
          'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.',
          'Ensure NEXTAUTH_SECRET is set in .env.',
        ],
      }}
    />
  );
}
