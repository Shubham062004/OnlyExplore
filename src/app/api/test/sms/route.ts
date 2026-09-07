import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';
import { sendSMS } from '@/lib/sms';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  const isConfigured = !!(accountSid && authToken && phoneNumber);

  const envStatus = [
    {
      name: 'TWILIO_ACCOUNT_SID',
      configured: !!accountSid,
      maskedValue: maskSecret(accountSid),
      required: true,
      description: 'Twilio Account SID (starts with AC).',
    },
    {
      name: 'TWILIO_AUTH_TOKEN',
      configured: !!authToken,
      maskedValue: maskSecret(authToken),
      required: true,
      description: 'Twilio Secret Auth Token.',
    },
    {
      name: 'TWILIO_PHONE_NUMBER',
      configured: !!phoneNumber,
      maskedValue: maskSecret(phoneNumber),
      required: true,
      description: 'Registered sender Twilio phone number (E.164 format).',
    },
  ];

  if (!isConfigured) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Twilio SMS',
      category: 'Communications',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'Twilio SMS credentials are not fully configured in environment.',
      envStatus,
      error: {
        code: 'MISSING_CREDENTIALS',
        message: 'Twilio environment variables missing',
        category: 'CONFIGURATION',
        likelyCause: 'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_PHONE_NUMBER is not set in .env',
        fixSteps: [
          'Create a Twilio account at https://www.twilio.com',
          'Get your Account SID and Auth Token from the Twilio Console',
          'Buy or allocate an active Twilio phone number',
          'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to .env',
          'Restart the Next.js server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    // Non-destructive read check: retrieve account details to verify SID + Auth Token
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const twilioRes = await fetch(url, {
      headers: { Authorization: `Basic ${basicAuth}` },
      signal: AbortSignal.timeout(8000),
    });
    const duration = Math.round(performance.now() - start);

    if (!twilioRes.ok) {
      const errJson = await twilioRes.json().catch(() => ({}));
      const errMsg = errJson?.message || twilioRes.statusText;
      const classification = classifyError(twilioRes.status, errMsg, 'Twilio SMS');

      const res: NormalizedTestResult = {
        success: false,
        service: 'Twilio SMS',
        category: 'Communications',
        configured: true,
        authenticated: twilioRes.status !== 401 && twilioRes.status !== 403,
        reachable: true,
        httpStatus: twilioRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `Twilio API authentication failed: HTTP ${twilioRes.status} (${errMsg})`,
        envStatus,
        error: {
          code: String(errJson?.code || twilioRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await twilioRes.json();

    const res: NormalizedTestResult = {
      success: true,
      service: 'Twilio SMS',
      category: 'Communications',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Twilio account verified (${data.friendly_name || 'Active'}). (No SMS was sent for this test).`,
      envStatus,
      data: {
        accountName: data.friendly_name,
        accountStatus: data.status,
        accountType: data.type,
        senderNumber: phoneNumber ? `${phoneNumber.slice(0, 3)}...${phoneNumber.slice(-4)}` : undefined,
        manualSendAvailable: true,
      },
      capabilities: {
        accountVerification: 'supported',
        smsDispatch: 'supported',
        phoneAuth: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Network error', 'Twilio SMS');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Twilio SMS',
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
 * Explicit manual action ONLY to send a test SMS when the user triggers it from the detail page.
 */
export async function POST(req: NextRequest) {
  const start = performance.now();
  try {
    const body = await req.json();
    const { recipientPhone } = body;

    if (!recipientPhone || recipientPhone.length < 8) {
      return NextResponse.json(
        { success: false, error: 'A valid recipient phone number (with country code, e.g. +91...) is required.' },
        { status: 400 }
      );
    }

    const sendRes = await sendSMS({
      to: recipientPhone,
      body: `OnlyExplore Test: Your SMS integration is working properly! (${new Date().toLocaleTimeString()})`,
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
