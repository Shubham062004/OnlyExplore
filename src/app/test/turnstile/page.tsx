'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function TurnstileTestPage() {
  return (
    <TestDetailPage
      title="Cloudflare Turnstile"
      category="Authentication & Security"
      description="Smart CAPTCHA replacement providing invisible and managed bot protection on registration and login forms."
      apiEndpoint="/api/test/turnstile"
      requiredEnvVars={[
        {
          name: 'TURNSTILE_SECRET_KEY',
          description: 'Server secret used with https://challenges.cloudflare.com/turnstile/v0/siteverify.',
          serverOnly: true,
        },
        {
          name: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
          description: 'Client site key embedded in the React Turnstile widget.',
          serverOnly: false,
        },
      ]}
      howItWorks="Invoked during user registration and password reset via verifyCaptcha(). In local development, if keys are missing, verification logs a warning and passes gracefully."
      fixGuide={{
        portalName: 'Cloudflare Dashboard',
        portalUrl: 'https://dash.cloudflare.com/?to=/:account/turnstile',
        steps: [
          'Log in to Cloudflare Dashboard.',
          'Navigate to "Turnstile" and click "Add widget".',
          'Add your domains (localhost, your-domain.com).',
          'Copy the Site Key and Secret Key.',
          'Set TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY in .env.',
        ],
      }}
    />
  );
}
