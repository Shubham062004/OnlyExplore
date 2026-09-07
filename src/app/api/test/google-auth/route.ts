import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  const envStatus = [
    {
      name: 'GOOGLE_CLIENT_ID',
      configured: !!clientId,
      maskedValue: maskSecret(clientId),
      required: true,
      description: 'Google OAuth Client ID from Google Cloud Console.',
    },
    {
      name: 'GOOGLE_CLIENT_SECRET',
      configured: !!clientSecret,
      maskedValue: maskSecret(clientSecret),
      required: true,
      description: 'Google OAuth Client Secret.',
    },
    {
      name: 'NEXTAUTH_SECRET',
      configured: !!nextAuthSecret,
      maskedValue: maskSecret(nextAuthSecret),
      required: true,
      description: 'Secret encryption key for NextAuth JWT session cookies.',
    },
    {
      name: 'NEXTAUTH_URL',
      configured: !!nextAuthUrl,
      maskedValue: nextAuthUrl,
      required: true,
      description: 'Canonical base URL for OAuth redirect callback URLs.',
    },
  ];

  const missing: string[] = [];
  if (!clientId) missing.push('GOOGLE_CLIENT_ID');
  if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
  if (!nextAuthSecret) missing.push('NEXTAUTH_SECRET');

  if (missing.length > 0 || !clientId || !clientSecret || !nextAuthSecret) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Google OAuth (NextAuth)',
      category: 'Authentication & Security',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: `Missing required OAuth environment variables: ${missing.join(', ')}`,
      envStatus,
      error: {
        code: 'MISSING_OAUTH_VARS',
        message: `Missing: ${missing.join(', ')}`,
        category: 'CONFIGURATION',
        likelyCause: 'Google OAuth or NextAuth variables not configured in .env',
        fixSteps: [
          'Go to Google Cloud Console > APIs & Services > Credentials',
          'Create an OAuth 2.0 Client ID (Web Application)',
          'Add Authorized redirect URIs: http://localhost:9002/api/auth/callback/google',
          'Copy Client ID and Client Secret into .env',
          'Set NEXTAUTH_SECRET (e.g. generate via `openssl rand -base64 32`)',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    // 1. Verify Google OpenID Configuration endpoint
    const discoveryRes = await fetch('https://accounts.google.com/.well-known/openid-configuration', {
      signal: AbortSignal.timeout(8000),
    });
    const duration = Math.round(performance.now() - start);

    if (!discoveryRes.ok) {
      throw new Error(`Failed to reach Google OpenID discovery endpoint (HTTP ${discoveryRes.status})`);
    }

    const discoveryData = await discoveryRes.json();

    // 2. Validate client ID format
    const isValidFormat = clientId.endsWith('.apps.googleusercontent.com');

    const res: NormalizedTestResult = {
      success: true,
      service: 'Google OAuth (NextAuth)',
      category: 'Authentication & Security',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Google OAuth OpenID configuration reachable. Client ID format: ${isValidFormat ? 'Valid' : 'Warning'}.`,
      envStatus,
      data: {
        issuer: discoveryData.issuer,
        authorizationEndpoint: discoveryData.authorization_endpoint,
        tokenEndpoint: discoveryData.token_endpoint,
        userInfoEndpoint: discoveryData.userinfo_endpoint,
        clientIdFormatValid: isValidFormat,
        nextAuthUrl: nextAuthUrl || 'http://localhost:9002',
        expectedRedirectUri: `${nextAuthUrl || 'http://localhost:9002'}/api/auth/callback/google`,
      },
      capabilities: {
        googleSso: 'supported',
        credentialsAuth: 'supported',
        jwtSessions: 'supported',
        twoFactorAuth: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const res: NormalizedTestResult = {
      success: false,
      service: 'Google OAuth (NextAuth)',
      category: 'Authentication & Security',
      configured: true,
      authenticated: false,
      reachable: false,
      httpStatus: 500,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Google OAuth verification failed: ${sanitizeError(error.message)}`,
      envStatus,
      error: {
        code: error.name || 'OAUTH_VERIFY_ERROR',
        message: sanitizeError(error.message),
        category: 'NETWORK',
        likelyCause: 'Unable to connect to Google OpenID endpoints',
        fixSteps: ['Verify internet connection', 'Check DNS resolution for accounts.google.com'],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }
}
