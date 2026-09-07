import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { NormalizedTestResult } from '@/lib/testCenter/types';
import { maskSecret, sanitizeError } from '@/lib/testCenter/serverUtils';

export async function GET(_req: NextRequest) {
  const start = performance.now();
  const uri = process.env.MONGODB_URI;

  const envStatus = [
    {
      name: 'MONGODB_URI',
      configured: !!uri,
      maskedValue: uri ? maskSecret(uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')) : undefined,
      required: true,
      description: 'MongoDB Atlas connection string.',
    },
  ];

  if (!uri) {
    const res: NormalizedTestResult = {
      success: false,
      service: 'MongoDB Atlas',
      category: 'Database & Cache',
      configured: false,
      authenticated: false,
      reachable: false,
      httpStatus: 400,
      responseTimeMs: Math.round(performance.now() - start),
      testedAt: new Date().toISOString(),
      resultSummary: 'MONGODB_URI is not configured.',
      envStatus,
      error: {
        code: 'MISSING_MONGODB_URI',
        message: 'MongoDB URI is missing from environment',
        category: 'CONFIGURATION',
        likelyCause: 'MONGODB_URI is not defined in .env',
        fixSteps: [
          'Get your connection URI from MongoDB Atlas (Cluster > Connect > Connect your application)',
          'Add MONGODB_URI=mongodb+srv://... to .env',
          'Make sure IP Access List allows current IP address or 0.0.0.0/0 in Atlas Network Access',
        ],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }

  try {
    // If mongoose already connected, execute admin ping directly; else connect
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('MongoDB database instance is undefined.');
    }

    // Safe read-only ping command
    const pingRes = await db.admin().ping();
    const duration = Math.round(performance.now() - start);

    const dbName = db.databaseName;
    const collections = await db.listCollections().toArray().catch(() => []);

    const res: NormalizedTestResult = {
      success: true,
      service: 'MongoDB Atlas',
      category: 'Database & Cache',
      configured: true,
      authenticated: true,
      reachable: true,
      httpStatus: 200,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `MongoDB connected successfully. Ping ok (${duration}ms).`,
      envStatus,
      data: {
        ping: pingRes,
        databaseName: dbName,
        connectionState: mongoose.connection.readyState === 1 ? 'connected' : 'connecting',
        collectionsCount: collections.length,
        collectionsSample: collections.slice(0, 8).map((c: any) => c.name),
      },
      capabilities: {
        readWrite: 'supported',
        aggregationPipeline: 'supported',
        indexOptimization: 'supported',
      },
    };
    return NextResponse.json(res);
  } catch (error: any) {
    const duration = Math.round(performance.now() - start);
    const sanitizedMsg = sanitizeError(error.message);

    let category: any = 'DATABASE';
    let likelyCause = 'Failed to connect to MongoDB cluster.';
    const fixSteps: string[] = [];

    if (sanitizedMsg.includes('Authentication failed') || sanitizedMsg.includes('auth failed')) {
      category = 'AUTHENTICATION';
      likelyCause = 'MongoDB credentials (username or password) in MONGODB_URI are incorrect.';
      fixSteps.push('Verify database user and password in MongoDB Atlas Database Access tab');
      fixSteps.push('Ensure special characters in password are URL-encoded if applicable');
    } else if (sanitizedMsg.includes('whitelist') || sanitizedMsg.includes('selection timed out') || sanitizedMsg.includes('ECONNREFUSED')) {
      category = 'NETWORK';
      likelyCause = 'Network timeout or IP address is not whitelisted in MongoDB Atlas.';
      fixSteps.push('Go to MongoDB Atlas > Network Access');
      fixSteps.push('Add your current IP address or allow 0.0.0.0/0 for serverless deployments');
    }

    const res: NormalizedTestResult = {
      success: false,
      service: 'MongoDB Atlas',
      category: 'Database & Cache',
      configured: true,
      authenticated: category !== 'AUTHENTICATION',
      reachable: false,
      httpStatus: 500,
      responseTimeMs: duration,
      testedAt: new Date().toISOString(),
      resultSummary: `MongoDB error: ${sanitizedMsg}`,
      envStatus,
      error: {
        code: error.name || 'MONGO_CONNECTION_ERROR',
        message: sanitizedMsg,
        category,
        likelyCause,
        fixSteps: fixSteps.length > 0 ? fixSteps : ['Check MongoDB Atlas cluster status', 'Review MONGODB_URI in .env'],
      },
    };
    return NextResponse.json(res, { status: 200 });
  }
}
