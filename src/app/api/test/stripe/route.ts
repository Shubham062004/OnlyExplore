import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const envStatus = [
    {
      name: 'STRIPE_SECRET_KEY',
      configured: !!secretKey,
      maskedValue: maskSecret(secretKey),
      required: true,
      description: 'Stripe Secret API Key (sk_test_... or sk_live_...).',
    },
    {
      name: 'STRIPE_PRICE_ID',
      configured: !!priceId,
      maskedValue: maskSecret(priceId),
      required: false,
      description: 'Stripe subscription product Price ID (price_...).',
    },
    {
      name: 'STRIPE_WEBHOOK_SECRET',
      configured: !!webhookSecret,
      maskedValue: maskSecret(webhookSecret),
      required: false,
      description: 'Signing secret for Stripe webhook validation (whsec_...).',
    },
  ];

  if (!secretKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Stripe Payments',
      category: 'Commerce & Financial',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'STRIPE_SECRET_KEY is not configured in environment.',
      envStatus,
      error: {
        code: 'MISSING_SECRET_KEY',
        message: 'Stripe Secret Key missing',
        category: 'CONFIGURATION',
        likelyCause: 'STRIPE_SECRET_KEY is not set in .env',
        fixSteps: [
          'Log in to Stripe Dashboard (https://dashboard.stripe.com)',
          'Go to Developers > API keys',
          'Copy your Secret key (sk_test_...)',
          'Add STRIPE_SECRET_KEY=sk_test_... to .env',
          'Restart the Next.js development server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    // Non-destructive read check: retrieve balance
    const stripeRes = await fetch('https://api.stripe.com/v1/balance', {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      signal: AbortSignal.timeout(8000),
    });
    const duration = Math.round(performance.now() - start);

    if (!stripeRes.ok) {
      const errJson = await stripeRes.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || stripeRes.statusText;
      const classification = classifyError(stripeRes.status, errMsg, 'Stripe Payments');

      const res: NormalizedTestResult = {
        success: false,
        service: 'Stripe Payments',
        category: 'Commerce & Financial',
        configured: true,
        authenticated: false,
        reachable: true,
        httpStatus: stripeRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `Stripe API error: HTTP ${stripeRes.status} (${errMsg})`,
        envStatus,
        error: {
          code: errJson?.error?.code || String(stripeRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await stripeRes.json();
    const isLive = secretKey.startsWith('sk_live');

    const res: NormalizedTestResult = {
      success: true,
      service: 'Stripe Payments',
      category: 'Commerce & Financial',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Stripe account connected successfully (${isLive ? 'Live Mode' : 'Test Mode'}).`,
      envStatus,
      data: {
        mode: isLive ? 'Live' : 'Test',
        currenciesAvailable: data.available?.map((a: any) => a.currency.toUpperCase()) || ['USD'],
        priceIdConfigured: !!priceId,
        webhookConfigured: !!webhookSecret,
      },
      capabilities: {
        checkoutSessions: 'supported',
        subscriptions: 'supported',
        webhooks: webhookSecret ? 'supported' : 'conditional',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'Stripe Payments');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Stripe Payments',
      category: 'Commerce & Financial',
      configured: true,
      authenticated: false,
      reachable: false,
      httpStatus: 500,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Connection failed: ${sanitizeError(error.message)}`,
      envStatus,
      error: {
        code: error.name || 'FETCH_ERROR',
        message: sanitizeError(error.message),
        category: classification.category,
        likelyCause: classification.likelyCause,
        fixSteps: classification.fixSteps,
      },
    };
    return NextResponse.json(res, { status: 200 });
  }
}
