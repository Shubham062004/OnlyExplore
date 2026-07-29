import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import DestinationImages from '@/models/DestinationImages';
import { ImageService } from '@/services/image.service';
import { cacheService } from '@/services/cache.service';

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600&auto=format&fit=crop';

const CATEGORIES = [
  { category: 'Nature', label: 'Pristine Nature', modifier: 'nature wilderness landscape' },
  { category: 'Mountains', label: 'Alpine Peaks', modifier: 'mountains peaks snow cliffs' },
  { category: 'Rivers', label: 'Rivers & Waterfalls', modifier: 'river waterfall stream lake' },
  { category: 'Culture', label: 'Heritage & Culture', modifier: 'culture temple architecture tradition' },
  { category: 'Food', label: 'Local Food & Cafes', modifier: 'food restaurant cafe local dish' },
  { category: 'Adventure', label: 'Thrill & Adventure', modifier: 'adventure trekking sports action' },
  { category: 'Hotels', label: 'Luxury Stays & Resorts', modifier: 'resort hotel boutique stay' },
  { category: 'Attractions', label: 'Iconic Landmarks', modifier: 'landmark tourism spot view' },
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
        const formattedGallery = existing.gallery.map((item: any, idx: number) => ({
          id: `img-${idx}`,
          url: typeof item === 'string' ? item : item.url,
          label: typeof item === 'string' ? 'Experience' : item.label || 'Destination Spot',
          category: typeof item === 'object' && item.category ? item.category : CATEGORIES[idx % CATEGORIES.length].category,
          caption: `${destination} - ${typeof item === 'object' && item.label ? item.label : 'Scenic View'}`,
          attribution: 'Photo via Unsplash / OnlyExplore Travel Intelligence',
        }));

        const responseData = {
          destination: existing.destination,
          heroImage: existing.heroImage,
          gallery: formattedGallery,
          fromCache: true,
        };

        await cacheService.set(redisKey, responseData, 15 * 60);
        return NextResponse.json(responseData);
      }
    }

    // 3. Fetch Hero Image
    const heroPool = await ImageService.fetchBulkPremiumImages(`${destination} cinematic travel landscape`, 3);
    const heroImage = heroPool[0] || FALLBACK_HERO;

    // 4. Fetch Categorized Gallery in Parallel across 8 categories
    const galleryItems: Array<{ id: string; url: string; label: string; category: string; caption: string; attribution: string }> = [];
    const usedUrls = new Set<string>([heroImage]);

    const categoryResults = await Promise.all(
      CATEGORIES.map(async (cat) => {
        const results = await ImageService.fetchBulkPremiumImages(`${destination} ${cat.modifier}`, 2);
        return results.map((url) => ({
          url,
          label: cat.label,
          category: cat.category,
        }));
      })
    );

    // Merge & Deduplicate
    let itemIdx = 0;
    for (const results of categoryResults) {
      for (const item of results) {
        if (!usedUrls.has(item.url) && galleryItems.length < 16) {
          galleryItems.push({
            id: `img-${itemIdx++}`,
            url: item.url,
            label: item.label,
            category: item.category,
            caption: `Breathtaking ${item.category.toLowerCase()} view in ${destination}`,
            attribution: 'Photo via Unsplash / OnlyExplore',
          });
          usedUrls.add(item.url);
        }
      }
    }

    if (galleryItems.length === 0) {
      galleryItems.push({
        id: 'img-0',
        url: ImageService.optimizeUnsplashUrl(`https://images.unsplash.com/featured/800x600/?${encodeURIComponent(destination)},travel`),
        label: 'Destination Landmark',
        category: 'Attractions',
        caption: `Iconic view of ${destination}`,
        attribution: 'Photo via Unsplash',
      });
    }

    const responseData = {
      destination: key,
      heroImage,
      gallery: galleryItems,
      fromCache: false,
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
      gallery: [
        {
          id: 'img-fallback',
          url: FALLBACK_HERO,
          label: 'Explore Destination',
          category: 'Attractions',
          caption: `Scenic view of ${destination}`,
          attribution: 'Photo via Unsplash',
        },
      ],
      fromCache: false,
      error: true,
    });
  }
}
