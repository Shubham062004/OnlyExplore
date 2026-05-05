import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DestinationGuide from '@/models/DestinationGuide';

/**
 * GET /api/destination-guide/export?location=manali
 *
 * Returns the full cached guide JSON for a destination.
 * Use this to inspect AI output or pipe to GPT.
 *
 * Only available in development for safety.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location')?.toLowerCase().trim();

  if (!location) {
    return NextResponse.json({ error: 'location param required' }, { status: 400 });
  }

  try {
    await connectDB();
    const doc = await DestinationGuide.findOne({
      destination: { $regex: new RegExp('^' + location + '$', 'i') },
    }).lean();

    if (!doc) {
      return NextResponse.json(
        { error: `No cached guide for "${location}". Visit /destination/${location} first to generate it.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { destination: location, cached: true, data: (doc as any).data },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
