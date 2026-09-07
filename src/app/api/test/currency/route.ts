import { NextRequest, NextResponse } from 'next/server';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { convertUSDToINR, formatCurrency } from '@/lib/currency';

export async function GET(_req: NextRequest) {
  const start = performance.now();

  const envStatus = [
    {
      name: 'CURRENCY_PROVIDER',
      configured: true,
      maskedValue: 'Internal Utility + Open Exchange API',
      required: false,
      description: 'Built-in Indian Rupee formatting & currency engine.',
    },
  ];

  try {
    // 1. Internal OnlyExplore conversion test
    const testUsd = 100;
    const internalInr = convertUSDToINR(testUsd);
    const formattedInr = formatCurrency(internalInr);

    // 2. Query public exchange rates endpoint (Frankfurter Open Rates)
    let liveRate: number | null = null;
    let liveDate: string | null = null;

    try {
      const openRes = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR', {
        signal: AbortSignal.timeout(6000),
      });
      if (openRes.ok) {
        const liveData = await openRes.json();
        liveRate = liveData?.rates?.INR || null;
        liveDate = liveData?.date || null;
      }
    } catch {
      // Fallback if public free rate API is offline
    }

    const duration = Math.round(performance.now() - start);

    const res: NormalizedTestResult = {
      success: true,
      service: 'Currency Conversion',
      category: 'Commerce & Financial',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Currency engine operational. $${testUsd} USD = ${formattedInr} (Live Rate: ${liveRate ? `₹${liveRate}` : '₹88.7 static'}).`,
      envStatus,
      data: {
        sampleConversion: {
          usd: testUsd,
          convertedInr: internalInr,
          formatted: formattedInr,
        },
        staticConfiguredRate: 88.7,
        liveMarketRate: liveRate,
        rateDate: liveDate || new Date().toISOString().split('T')[0],
        supportedFormats: ['₹ (INR)', '$ (USD)', '€ (EUR)', '£ (GBP)'],
      },
      capabilities: {
        indianNumberingSystem: 'supported',
        lakhsAndCrores: 'supported',
        liveExchangeRateProbe: liveRate ? 'supported' : 'conditional',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const res: NormalizedTestResult = {
      success: false,
      service: 'Currency Conversion',
      category: 'Commerce & Financial',
      configured: true,
      authenticated: false,
      reachable: false,
      httpStatus: 500,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Currency calculation error: ${error.message}`,
      envStatus,
      error: {
        code: 'CURRENCY_CONVERSION_ERROR',
        message: error.message,
        category: 'UNKNOWN',
        likelyCause: 'Internal conversion utility error',
      },
    };
    return NextResponse.json(res, { status: 200 });
  }
}
