import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DestinationImages from '@/models/DestinationImages';
import { ImageService } from '@/services/image.service';
import { cacheService } from '@/services/cache.service';

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get('destination');

  if (!destination) {
    return NextResponse.json({ error: 'destination param required' }, { status: 400 });
  }

  const key = destination.toLowerCase().trim();
  const redisKey = `destinationimages:${key}`;

  try {
    // 1. Check Redis Cache
    const cachedData = await cacheService.get<any>(redisKey);
    if (cachedData) {
      console.log('⚡ Redis hit for destination images:', key);
      return NextResponse.json(cachedData);
    }

    await connectDB();

    // 2. Check MongoDB Cache
    const existing = await DestinationImages.findOne({ destination: key }).lean();
    if (existing) {
      const lastFetched = (existing as any).lastFetched || new Date(0);
      const cacheAgeMs = Date.now() - new Date(lastFetched).getTime();
      const fifteenMinutesMs = 15 * 60 * 1000;

      if (cacheAgeMs < fifteenMinutesMs) {
        const formattedGallery = existing.gallery.map((item: any) => 
          typeof item === 'string' ? { url: item, label: 'Experience' } : { url: item.url, label: item.label }
        );

        const responseData = {
          destination: existing.destination,
          heroImage: existing.heroImage,
          gallery: formattedGallery,
          fromCache: true,
        };

        // Populate Redis cache
        await cacheService.set(redisKey, responseData, 15 * 60);
        return NextResponse.json(responseData);
      }
    }

    // 3. Fetch Hero Image
    const heroPool = await ImageService.fetchBulkPremiumImages(`${destination} cinematic travel landscape`, 3);
    const heroImage = heroPool[0] || FALLBACK_HERO;

    // 4. Fetch Categorized Gallery in Parallel
    const galleryItems: { url: string; label: string }[] = [];
    const usedUrls = new Set<string>([heroImage]);

    const categoryResults = await Promise.all(
      CATEGORIES.map(async (cat) => {
        const results = await ImageService.fetchBulkPremiumImages(`${destination} ${cat.modifier}`, 3);
        return results.map(url => ({ url, label: cat.label }));
      })
    );

    // Merge & Deduplicate
    for (const results of categoryResults) {
      for (const item of results) {
        if (!usedUrls.has(item.url) && galleryItems.length < 12) {
          galleryItems.push(item);
          usedUrls.add(item.url);
        }
      }
    }

    if (galleryItems.length === 0) {
      galleryItems.push({ 
        url: ImageService.optimizeUnsplashUrl(`https://images.unsplash.com/featured/800x600/?${encodeURIComponent(destination)},travel`), 
        label: 'Destination' 
      });
    }

    const responseData = {
      destination: key,
      heroImage,
      gallery: galleryItems,
      fromCache: false
    };

    // 5. Save to Cache
    await DestinationImages.findOneAndUpdate(
      { destination: key },
      {
        destination: key,
        heroImage,
        gallery: galleryItems,
        lastFetched: new Date(),
      },
      { upsert: true, new: true }
    );

    await cacheService.set(redisKey, responseData, 15 * 60);

    return NextResponse.json(responseData);
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
