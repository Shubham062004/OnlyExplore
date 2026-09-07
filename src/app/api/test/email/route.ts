import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';
import { sendEmail } from '@/lib/email';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const apiKey = process.env.RESEND_API_KEY;

  const envStatus = [
    {
      name: 'RESEND_API_KEY',
      configured: !!apiKey,
      maskedValue: maskSecret(apiKey),
      required: true,
      description: 'Resend API Key for sending transactional emails.',
    },
  ];

  if (!apiKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Resend Email',
      category: 'Communications',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'RESEND_API_KEY is not configured in environment. Local mock mode is active.',
      envStatus,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Resend API Key missing',
        category: 'CONFIGURATION',
        likelyCause: 'RESEND_API_KEY is not defined in .env or .env.local',
        fixSteps: [
          'Create a free account at https://resend.com',
          'Generate an API key in the Resend dashboard (API Keys tab)',
          'Add RESEND_API_KEY=re_... to .env',
          'Restart the Next.js development server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    // Non-destructive read check: list API keys to verify credentials
    const resendRes = await fetch('https://api.resend.com/api-keys', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(8000),
    });
    const duration = Math.round(performance.now() - start);

    if (!resendRes.ok) {
      const errJson = await resendRes.json().catch(() => ({}));
      const errMsg = errJson?.message || resendRes.statusText;

      // Special case: Resend "Sending access" key is verified and authenticated for sending!
      if (errMsg.toLowerCase().includes('only send emails')) {
        const res: NormalizedTestResult = {
          success: true,
          service: 'Resend Email',
          category: 'Communications',
          configured: true,
          authenticated: true,
          reachable: true,
          httpStatus: 200,
          responseTimeMs: duration,
          testedAt: new Date().toISOString(),
          resultSummary: 'Resend API key verified (Authenticated with Sending Access permissions).',
          envStatus,
          data: {
            provider: 'Resend REST API',
            authenticated: true,
            keyPermission: 'Sending Access (Scoped strictly to send emails)',
            manualSendAvailable: true,
          },
          capabilities: {
            credentialVerification: 'supported',
            transactionalDispatch: 'supported',
            domainVerification: 'conditional',
          },
        };
        return NextResponse.json(res);
      }

      const classification = classifyError(resendRes.status, errMsg, 'Resend Email');

      const res: NormalizedTestResult = {
        success: false,
        service: 'Resend Email',
        category: 'Communications',
        configured: true,
        authenticated: resendRes.status !== 401 && resendRes.status !== 403,
        reachable: true,
        httpStatus: resendRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `Resend API authentication failed: HTTP ${resendRes.status} (${errMsg})`,
        envStatus,
        error: {
          code: String(resendRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await resendRes.json().catch(() => ({}));

    const res: NormalizedTestResult = {
      success: true,
      service: 'Resend Email',
      category: 'Communications',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: 'Resend API credentials verified successfully. (No email was dispatched for this test).',
      envStatus,
      data: {
        provider: 'Resend REST API',
        authenticated: true,
        apiKeysConfigured: Array.isArray(data?.data) ? data.data.length : 1,
        defaultSender: 'OnlyExplore <noreply@onlyexplore.app>',
        manualSendAvailable: true,
      },
      capabilities: {
        credentialVerification: 'supported',
        transactionalDispatch: 'supported',
        domainVerification: 'conditional',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'Resend Email');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Resend Email',
      category: 'Communications',
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

/**
 * Explicit manual action ONLY to send a test email when the user triggers it from the detail page.
 */
export async function POST(req: NextRequest) {
  const start = performance.now();
  try {
    const body = await req.json();
    const { recipientEmail } = body;

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid recipient email address is required.' },
        { status: 400 }
      );
    }

    const sendRes = await sendEmail({
      to: recipientEmail,
      subject: 'OnlyExplore — API Integration Test',
      html: `
        <div style="font-family: sans-serif; padding: 24px; color: #1e1b4b; background: #faf5ff; border-radius: 12px;">
          <h2 style="color: #7c3aed; margin-top: 0;">OnlyExplore Integration Test</h2>
          <p>This is a manual verification email dispatched from the <strong>OnlyExplore API Test Center</strong>.</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <hr style="border: 0; border-top: 1px solid #e9d5ff; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280;">Your transactional email pipeline via Resend is working properly.</p>
        </div>
      `,
    });

    const duration = Math.round(performance.now() - start);
    return NextResponse.json({
      success: sendRes.success,
      responseTimeMs: duration,
      data: sendRes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: sanitizeError(err.message) },
      { status: 500 }
    );
  }
}
