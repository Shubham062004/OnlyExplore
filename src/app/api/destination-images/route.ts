import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DestinationImages from '@/models/DestinationImages';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600&auto=format&fit=crop';

async function fetchUnsplashImages(
  query: string,
  perPage = 8,
  accessKey: string
): Promise<string[]> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=${perPage}&orientation=landscape&client_id=${accessKey}`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results || []).map(
    (img: any) =>
      img.urls?.regular ||
      img.urls?.small ||
      `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(query)}`
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination');

  if (!destination) {
    return NextResponse.json({ error: 'destination param required' }, { status: 400 });
  }

  const key = destination.toLowerCase().trim();
  const ACCESS_KEY =
    process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';

  try {
    await connectDB();

    // ─── STEP 1: Check DB cache ───────────────────────────────────────────────
    const existing = await DestinationImages.findOne({ destination: key });
    if (existing) {
      return NextResponse.json({
        destination: existing.destination,
        heroImage: existing.heroImage,
        gallery: existing.gallery,
        fromCache: true,
      });
    }

    // ─── STEP 2: Fetch from Unsplash ─────────────────────────────────────────
    if (!ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY not configured');

    const [heroImages, touristImages, attractionImages, cultureImages] = await Promise.all([
      fetchUnsplashImages(`${destination} city landscape`, 2, ACCESS_KEY),
      fetchUnsplashImages(`${destination} tourist places`, 3, ACCESS_KEY),
      fetchUnsplashImages(`${destination} attractions`, 3, ACCESS_KEY),
      fetchUnsplashImages(`${destination} culture`, 2, ACCESS_KEY),
    ]);

    const heroImage = heroImages[0] || FALLBACK_HERO;

    // Combine gallery images (dedup) — 6–8 images
    const galleryPool = [
      ...heroImages.slice(1),
      ...touristImages,
      ...attractionImages,
      ...cultureImages,
    ];
    const uniqueGallery = [...new Set(galleryPool)].slice(0, 8);

    const gallery =
      uniqueGallery.length > 0
        ? uniqueGallery
        : [
            `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(destination)},landmark`,
            `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(destination)},nature`,
          ];

    // ─── STEP 3: Save to MongoDB ──────────────────────────────────────────────
    await DestinationImages.create({
      destination: key,
      heroImage,
      gallery,
      lastFetched: new Date(),
    });

    // ─── STEP 4: Return ───────────────────────────────────────────────────────
    return NextResponse.json({ destination: key, heroImage, gallery, fromCache: false });
  } catch (error) {
    console.error('destination-images API error:', error);

    // Graceful fallback — never break the UI
    return NextResponse.json({
      destination: key,
      heroImage: FALLBACK_HERO,
      gallery: [
        `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(key)},travel`,
        `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(key)},landmark`,
        `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(key)},nature`,
      ],
      fromCache: false,
      fallback: true,
    });
  }
}
