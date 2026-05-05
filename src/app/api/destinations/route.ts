import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Destination from '@/models/Destination';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const destinations = await Destination.find({}).lean();

    // Group by category
    const categoryMap: Record<string, { name: string; slug: string; bestFor: string[] }[]> = {};
    for (const d of destinations) {
      if (!categoryMap[d.category]) categoryMap[d.category] = [];
      categoryMap[d.category].push({
        name: d.name,
        slug: d.slug,
        bestFor: d.bestFor || [],
      });
    }

    return NextResponse.json({ categories: categoryMap, destinations });
  } catch (error) {
    console.error('destinations API error:', error);
    return NextResponse.json({ error: 'Failed to fetch destinations' }, { status: 500 });
  }
}
