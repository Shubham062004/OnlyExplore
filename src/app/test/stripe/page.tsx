'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function StripeTestPage() {
  return (
    <TestDetailPage
      title="Stripe Payments"
      category="Commerce & Financial"
      description="Payment gateway infrastructure for premium memberships, paid travel itineraries, and checkout webhooks."
      apiEndpoint="/api/test/stripe"
      requiredEnvVars={[
        {
          name: 'STRIPE_SECRET_KEY',
          description: 'Secret API key starting with sk_test_ or sk_live_.',
          serverOnly: true,
        },
        {
          name: 'STRIPE_PRICE_ID',
          description: 'Stripe product price identifier (price_...).',
          serverOnly: true,
        },
        {
          name: 'STRIPE_WEBHOOK_SECRET',
          description: 'Webhook endpoint signature secret (whsec_...).',
          serverOnly: true,
        },
      ]}
      howItWorks="Allows users to upgrade to premium tiers and purchase custom curated guides. This diagnostic page performs a safe read-only balance check to verify key validity."
      fixGuide={{
        portalName: 'Stripe Dashboard',
        portalUrl: 'https://dashboard.stripe.com/apikeys',
        steps: [
          'Log in to your Stripe Dashboard (ensure Test mode toggle is active during development).',
          'Navigate to Developers > API Keys.',
          'Reveal and copy your Secret key (sk_test_...).',
          'Create a Product & Recurring Price under Products to obtain STRIPE_PRICE_ID.',
          'Add keys to your .env file and restart dev server.',
        ],
      }}
    />
  );
}
