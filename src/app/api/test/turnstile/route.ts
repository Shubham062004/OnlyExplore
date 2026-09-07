import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const envStatus = [
    {
      name: 'TURNSTILE_SECRET_KEY',
      configured: !!secretKey,
      maskedValue: maskSecret(secretKey),
      required: true,
      description: 'Cloudflare Turnstile Secret Key used for server-side validation.',
    },
    {
      name: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      configured: !!siteKey,
      maskedValue: maskSecret(siteKey),
      required: true,
      description: 'Cloudflare Turnstile public site key used for client-side widget.',
    },
  ];

  if (!secretKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Cloudflare Turnstile',
      category: 'Authentication & Security',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'TURNSTILE_SECRET_KEY is not configured in environment.',
      envStatus,
      error: {
        code: 'MISSING_SECRET_KEY',
        message: 'Turnstile Secret Key missing',
        category: 'CONFIGURATION',
        likelyCause: 'TURNSTILE_SECRET_KEY is not defined in .env',
        fixSteps: [
          'Create a widget in Cloudflare Turnstile dashboard (https://dash.cloudflare.com/?to=/:account/turnstile)',
          'Copy Site Key and Secret Key',
          'Add TURNSTILE_SECRET_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY to .env',
          'Restart the Next.js server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    // Probe siteverify endpoint with dummy response to test secret key recognition
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey)}&response=probe_verification_token`,
      signal: AbortSignal.timeout(8000),
    });
    const duration = Math.round(performance.now() - start);

    if (!verifyRes.ok) {
      const errJson = await verifyRes.json().catch(() => ({}));
      const errMsg = errJson?.message || verifyRes.statusText;
      const classification = classifyError(verifyRes.status, errMsg, 'Cloudflare Turnstile');

      const res: NormalizedTestResult = {
        success: false,
        service: 'Cloudflare Turnstile',
        category: 'Authentication & Security',
        configured: true,
        authenticated: false,
        reachable: true,
        httpStatus: verifyRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `Cloudflare Turnstile endpoint error: HTTP ${verifyRes.status}`,
        envStatus,
        error: {
          code: String(verifyRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await verifyRes.json();
    const errorCodes: string[] = data['error-codes'] || [];

    // If error codes contain 'invalid-input-secret', the secret key is invalid!
    const isSecretInvalid = errorCodes.includes('invalid-input-secret');

    if (isSecretInvalid) {
      const res: NormalizedTestResult = {
        success: false,
        service: 'Cloudflare Turnstile',
        category: 'Authentication & Security',
        configured: true,
        authenticated: false,
        reachable: true,
        httpStatus: 200,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: 'Cloudflare Turnstile rejected TURNSTILE_SECRET_KEY as invalid.',
        envStatus,
        error: {
          code: 'INVALID_INPUT_SECRET',
          message: 'The provided TURNSTILE_SECRET_KEY is not recognized by Cloudflare.',
          category: 'AUTHENTICATION',
          likelyCause: 'Secret key has expired, was deleted, or belongs to another widget.',
          fixSteps: [
            'Go to Cloudflare Dashboard > Turnstile',
            'Verify widget secret key matches TURNSTILE_SECRET_KEY in .env',
          ],
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    // Cloudflare responded. The token was dummy so success is false, but secret is VALID (e.g. invalid-input-response).
    const res: NormalizedTestResult = {
      success: true,
      service: 'Cloudflare Turnstile',
      category: 'Authentication & Security',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: 'Cloudflare Turnstile API reachable and TURNSTILE_SECRET_KEY verified successfully.',
      envStatus,
      data: {
        siteverifyEndpointReachable: true,
        secretKeyRecognized: true,
        siteKeyPresent: !!siteKey,
        errorCodesReturned: errorCodes, // Typically ['invalid-input-response'] for probe tokens
      },
      capabilities: {
        managedChallenge: 'supported',
        nonInteractiveChallenge: 'supported',
        invisibleChallenge: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'Cloudflare Turnstile');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Cloudflare Turnstile',
      category: 'Authentication & Security',
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
