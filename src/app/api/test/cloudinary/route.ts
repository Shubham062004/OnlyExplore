import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError, classifyError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  const isConfigured = !!((cloudName && apiKey && apiSecret) || cloudinaryUrl);

  const envStatus = [
    {
      name: 'CLOUDINARY_CLOUD_NAME',
      configured: !!cloudName,
      maskedValue: cloudName ? maskSecret(cloudName) : undefined,
      required: !cloudinaryUrl,
      description: 'Your Cloudinary cloud account name.',
    },
    {
      name: 'CLOUDINARY_API_KEY',
      configured: !!apiKey,
      maskedValue: maskSecret(apiKey),
      required: !cloudinaryUrl,
      description: 'Cloudinary API Key for authentication.',
    },
    {
      name: 'CLOUDINARY_API_SECRET',
      configured: !!apiSecret,
      maskedValue: maskSecret(apiSecret),
      required: !cloudinaryUrl,
      description: 'Cloudinary API Secret for backend signing.',
    },
    {
      name: 'CLOUDINARY_URL',
      configured: !!cloudinaryUrl,
      maskedValue: maskSecret(cloudinaryUrl),
      required: false,
      description: 'Unified connection string (alternative to separate keys).',
    },
  ];

  if (!isConfigured) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'Cloudinary CDN',
      category: 'Media & Images',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'Cloudinary credentials are not configured.',
      envStatus,
      error: {
        code: 'MISSING_CREDENTIALS',
        message: 'Cloudinary configuration missing',
        category: 'CONFIGURATION',
        likelyCause: 'Neither CLOUDINARY_CLOUD_NAME/KEY/SECRET nor CLOUDINARY_URL is present in .env',
        fixSteps: [
          'Create a free account at https://cloudinary.com',
          'Copy your Cloud Name, API Key, and API Secret from the Dashboard',
          'Add them to .env and restart dev server',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    if (cloudinaryUrl) {
      cloudinary.config({ cloudinary_url: cloudinaryUrl });
    } else {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }

    // Call Cloudinary ping API
    const pingResult = await cloudinary.api.ping();
    const duration = Math.round(performance.now() - start);

    const res: NormalizedTestResult = {
      success: pingResult?.status === 'ok',
      service: 'Cloudinary CDN',
      category: 'Media & Images',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: 'Cloudinary ping successful. Image delivery and CDN pipeline are operational.',
      envStatus,
      data: {
        status: pingResult?.status,
        cloudName: cloudName || 'Configured via URL',
      },
      capabilities: {
        imageTransformation: 'supported',
        assetOptimization: 'supported',
        cdnDelivery: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const classification = classifyError(error.http_code || 0, error.message || 'Ping failed', 'Cloudinary');

    const res: NormalizedTestResult = {
      success: false,
      service: 'Cloudinary CDN',
      category: 'Media & Images',
      configured: true,
      authenticated: error.http_code !== 401,
      reachable: error.http_code !== 0,
      httpStatus: error.http_code || 500,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `Cloudinary error: ${sanitizeError(error.message)}`,
      envStatus,
      error: {
        code: String(error.http_code || 'CLOUDINARY_ERROR'),
        message: sanitizeError(error.message),
        category: classification.category,
        likelyCause: classification.likelyCause,
        fixSteps: classification.fixSteps,
      },
    };
    return NextResponse.json(res, { status: 200 });
  }
}
