import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DestinationImages from '@/models/DestinationImages';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600&auto=format&fit=crop';

const CATEGORIES = [
  { key: 'landscapes', label: 'Scenic View', modifier: 'aerial landscape nature' },
  { key: 'attractions', label: 'Famous Attraction', modifier: 'landmark heritage tourism' },
  { key: 'activities', label: 'Adventure', modifier: 'adventure sports activity' },
  { key: 'cafes', label: 'Food & Cafes', modifier: 'cafe restaurant street food' },
  { key: 'stays', label: 'Luxury Stay', modifier: 'resort hotel boutique homestay' },
  { key: 'culture', label: 'Local Culture', modifier: 'culture people tradition market' },
];

async function fetchUnsplashImages(
  query: string,
  perPage = 5,
  accessKey: string
): Promise<string[]> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
    query
  )}&per_page=${perPage}&orientation=landscape&client_id=${accessKey}`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || []).map((img: any) => img.urls?.regular || img.urls?.small);
  } catch (error) {
    console.error(`Unsplash fetch error for query "${query}":`, error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination');

  if (!destination) {
    return NextResponse.json({ error: 'destination param required' }, { status: 400 });
  }

  const key = destination.toLowerCase().trim();
  const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';

  try {
    await connectDB();

    // 1. Check Cache
    const existing = await DestinationImages.findOne({ destination: key });
    if (existing) {
      // Handle backward compatibility for string[] gallery
      const formattedGallery = existing.gallery.map((item: any) => 
        typeof item === 'string' ? { url: item, label: 'Experience' } : item
      );

      return NextResponse.json({
        destination: existing.destination,
        heroImage: existing.heroImage,
        gallery: formattedGallery,
        fromCache: true,
      });
    }

    if (!ACCESS_KEY) throw new Error('UNSPLASH_ACCESS_KEY not configured');

    // 2. Fetch Hero Image (Landscapes)
    const heroPool = await fetchUnsplashImages(`${destination} cinematic travel landscape`, 3, ACCESS_KEY);
    const heroImage = heroPool[0] || FALLBACK_HERO;

    // 3. Fetch Categorized Gallery
    const galleryItems: { url: string; label: string }[] = [];
    const usedUrls = new Set<string>([heroImage]);

    // Fetch in parallel for speed
    const categoryResults = await Promise.all(
      CATEGORIES.map(async (cat) => {
        const results = await fetchUnsplashImages(`${destination} ${cat.modifier}`, 3, ACCESS_KEY);
        return results.map(url => ({ url, label: cat.label }));
      })
    );

    // Merge with deduplication and order
    for (const results of categoryResults) {
      for (const item of results) {
        if (!usedUrls.has(item.url) && galleryItems.length < 12) {
          galleryItems.push(item);
          usedUrls.add(item.url);
        }
      }
    }

    // Fallback if empty
    if (galleryItems.length === 0) {
      galleryItems.push({ 
        url: `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(destination)},travel`, 
        label: 'Destination' 
      });
    }

    // 4. Save to Cache
    await DestinationImages.create({
      destination: key,
      heroImage,
      gallery: galleryItems,
      lastFetched: new Date(),
    });

    return NextResponse.json({ destination: key, heroImage, gallery: galleryItems, fromCache: false });
  } catch (error) {
    console.error('destination-images API error:', error);
    return NextResponse.json({
      destination: key,
      heroImage: FALLBACK_HERO,
      gallery: [{ url: FALLBACK_HERO, label: 'Explore' }],
      fromCache: false,
      error: true
    });
  }
}
