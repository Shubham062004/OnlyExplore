import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import PlaceImages from '@/models/PlaceImages';

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const place = searchParams.get('place');
  const city = searchParams.get('city');

  if (!place || !city) {
    return NextResponse.json({ error: 'place and city params required' }, { status: 400 });
  }

  const placeKey = `${place.toLowerCase().trim().replace(/\s+/g, '-')}-${city
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')}`;

  const ACCESS_KEY =
    process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';

  try {
    await connectDB();

    // ─── STEP 1: Check cache ───────────────────────────────────────────────
    const existing = await PlaceImages.findOne({ placeKey });
    if (existing) {
      return NextResponse.json({ images: existing.images, fromCache: true });
    }

    if (!ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY not configured');

    // ─── STEP 2: Fetch from Unsplash ──────────────────────────────────────
    const query = `${place} ${city}`;
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&per_page=4&client_id=${ACCESS_KEY}`;

    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) throw new Error(`Unsplash error: ${res.status}`);

    const data = await res.json();
    const images: string[] = (data.results || []).map(
      (img: any) =>
        img.urls?.regular ||
        `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(query)}`
    );

    const finalImages = images.length > 0 ? images : FALLBACK_IMAGES;

    // ─── STEP 3: Save to DB ───────────────────────────────────────────────
    await PlaceImages.create({
      placeKey,
      placeName: place,
      cityName: city,
      images: finalImages,
      lastFetched: new Date(),
    });

    return NextResponse.json({ images: finalImages, fromCache: false });
  } catch (error) {
    console.error('place-images API error:', error);
    return NextResponse.json({ images: FALLBACK_IMAGES, fromCache: false, fallback: true });
  }
}
