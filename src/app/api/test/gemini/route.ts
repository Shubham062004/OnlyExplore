import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  const envStatus = [
    {
      name: 'GOOGLE_API_KEY',
      configured: !!process.env.GOOGLE_API_KEY,
      maskedValue: maskSecret(process.env.GOOGLE_API_KEY),
      required: !process.env.GEMINI_API_KEY,
      description: 'Primary Google AI Studio / Cloud API key used by Genkit.',
    },
    {
      name: 'GEMINI_API_KEY',
      configured: !!process.env.GEMINI_API_KEY,
      maskedValue: maskSecret(process.env.GEMINI_API_KEY),
      required: false,
      description: 'Alternate Gemini API key alias.',
    },
  ];

  if (!apiKey) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Google Gemini AI',
      category: 'AI & Intelligence',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'GOOGLE_API_KEY or GEMINI_API_KEY is not configured in environment.',
      envStatus,
      error: {
        code: 'MISSING_API_KEY',
        message: 'Google Gemini API key missing',
        category: 'CONFIGURATION',
        likelyCause: 'Neither GOOGLE_API_KEY nor GEMINI_API_KEY is set in .env',
        fixSteps: [
          'Visit Google AI Studio (https://aistudio.google.com/app/apikey)',
          'Create a Gemini API key',
          'Add GOOGLE_API_KEY=your_key to .env',
          'Restart your dev server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  // Model used in OnlyExplore: gemini-2.5-flash (or gemini-1.5-flash fallback)
  const targetModel = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Return exactly: OnlyExplore Gemini API test successful.',
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 25,
          temperature: 0.1,
        },
      }),
      signal: AbortSignal.timeout(12000),
    });

    const duration = Math.round(performance.now() - start);

    if (!geminiRes.ok) {
      const errJson = await geminiRes.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || geminiRes.statusText;
      const classification = classifyError(geminiRes.status, errMsg, 'Google Gemini AI');

      const res: NormalizedTestResult = {
        success: false,
        service: 'Google Gemini AI',
        category: 'AI & Intelligence',
        configured: true,
        authenticated: geminiRes.status !== 401 && geminiRes.status !== 403,
        reachable: true,
        httpStatus: geminiRes.status,
        responseTimeMs: duration,
        testedAt: new Date().toISOString(),
        resultSummary: `Gemini API error: HTTP ${geminiRes.status}`,
        envStatus,
        error: {
          code: String(geminiRes.status),
          message: sanitizeError(errMsg),
          category: classification.category,
          likelyCause: classification.likelyCause,
          fixSteps: classification.fixSteps,
        },
      };
      return NextResponse.json(res, { status: 200 });
    }

    const data = await geminiRes.json();
    const candidateText =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No text returned';

    const res: NormalizedTestResult = {
      success: true,
      service: 'Google Gemini AI',
      category: 'AI & Intelligence',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Gemini generation successful using ${targetModel}.`,
      envStatus,
      data: {
        model: targetModel,
        prompt: 'Return exactly: OnlyExplore Gemini API test successful.',
        response: candidateText,
        finishReason: data.candidates?.[0]?.finishReason,
        usageMetadata: data.usageMetadata,
      },
      capabilities: {
        textGeneration: 'supported',
        structuredOutput: 'supported',
        itineraryFlows: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(0, error.message || 'Unknown network error', 'Google Gemini AI');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Google Gemini AI',
      category: 'AI & Intelligence',
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
