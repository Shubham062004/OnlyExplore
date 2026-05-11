'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { connectDB } from '@/lib/mongodb';
import DestinationGuide from '@/models/DestinationGuide';
import { fetchPremiumImage, generateContextualQuery } from '@/lib/imageService';

// ─────────────────────────────────────────────────────────────────────────────
// Schema — imageQuery on every visual item; image is attached after fetch
// ─────────────────────────────────────────────────────────────────────────────
const DestinationGuideSchema = z.object({
  destination: z.string(),
  hero: z.object({
    title: z.string(),
    description: z.string(),
  }).optional(),
  quickFacts: z.object({
    altitude: z.string().optional().describe("Altitude in meters e.g. '2050'"),
    bestTime: z.string(),
    temperature: z.string().optional().describe("Temperature range e.g. '-2°C to 18°C'"),
    location: z.string().describe("Format as 'State, Country' e.g. 'Himachal Pradesh, India'"),
  }),
  popularPlaces: z.array(z.object({
    name: z.string(),
    description: z.string().describe('max 15 words'),
    tags: z.array(z.string()).optional(),
    imageQuery: z.string().describe('specific Unsplash query e.g. "Solang Valley Manali snow"'),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    category: z.string().optional().describe('e.g. Attraction, Scenic Point, Hidden Gem'),
    rating: z.number().optional().describe('4.0-5.0'),
    duration: z.string().optional().describe('e.g. 2-3 hours'),
    bestTime: z.string().optional().describe('e.g. Early Morning, Sunset, April-June'),
  })),
  activities: z.array(z.object({
    name: z.string(),
    description: z.string().describe('max 15 words'),
    price: z.string().optional().describe('e.g. ₹1500'),
    location: z.string().optional(),
    season: z.enum(['Summer', 'Winter', 'All-Season']),
    difficulty: z.enum(['Easy', 'Moderate', 'Challenging']),
    intensity: z.enum(['Low', 'Medium', 'High']),
    imageQuery: z.string().describe('specific Unsplash query e.g. "paragliding Manali mountains"'),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    category: z.string().describe('e.g. Adventure, Relaxation, Culture'),
    rating: z.number().optional(),
    duration: z.string().optional().describe('e.g. 1 hour'),
    bestFor: z.array(z.string()).optional().describe('e.g. Couples, Families, Adrenaline Junkies'),
    timing: z.string().optional().describe('e.g. 6:00 AM - 10:00 AM'),
  })),
  hotels: z.array(z.object({
    name: z.string(),
    description: z.string().describe('max 15 words'),
    type: z.string().describe('e.g. Luxury Resort, Boutique Hotel, Backpacker Hostel, Homestay'),
    priceRange: z.string().describe('e.g. ₹5000 - ₹8000'),
    rating: z.number().optional().describe('0-5'),
    imageQuery: z.string().describe('specific Unsplash query e.g. "Manali luxury hotel mountain view"'),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    amenities: z.array(z.string()).describe('e.g. ["Wifi", "Mountain View", "Pool"]'),
    bestFor: z.array(z.string()).describe('e.g. ["Couples", "Solo Travelers"]'),
    category: z.literal('Stay'),
    tags: z.array(z.string()).optional(),
  })),
  itinerary: z.array(z.object({
    day: z.number(),
    title: z.string(),
    places: z.array(z.string()),
  })).optional(),
  rentals: z.array(z.object({
    type: z.string(),
    cost: z.string(),
  })),
  nearbyDestinations: z.array(z.object({
    name: z.string(),
    distance: z.string().optional(),
  })),
  travelTips: z.array(z.string()),
  packingGuide: z.array(z.string()),
});

// ─────────────────────────────────────────────────────────────────────────────
// Enriched types — `image` attached after Unsplash fetch
// ─────────────────────────────────────────────────────────────────────────────
export type RawGuide = z.infer<typeof DestinationGuideSchema>;

export interface EnrichedPlace {
  name: string;
  description: string;
  tags?: string[];
  imageQuery: string;
  image: string;
  category?: string;
  rating?: number;
  duration?: string;
  bestTime?: string;
  coordinates?: { lat: number; lng: number };
}

export interface EnrichedActivity {
  name: string;
  description: string;
  price?: string;
  location?: string;
  season: 'Summer' | 'Winter' | 'All-Season';
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  intensity: 'Low' | 'Medium' | 'High';
  imageQuery: string;
  image: string;
  category: string;
  rating?: number;
  duration?: string;
  bestFor?: string[];
  timing?: string;
}

export interface EnrichedHotel {
  name: string;
  description: string;
  type: string;
  priceRange: string;
  rating?: number;
  imageQuery: string;
  image: string;
  amenities: string[];
  bestFor: string[];
  category: 'Stay';
  tags?: string[];
  coordinates?: { lat: number; lng: number };
}

export interface DestinationGuideData extends Omit<RawGuide, 'popularPlaces' | 'activities' | 'hotels'> {
  heroImage?: string;
  popularPlaces: EnrichedPlace[];
  activities: EnrichedActivity[];
  hotels: EnrichedHotel[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Unsplash image fetcher
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop';

/**
 * Fetches an image from Unsplash with caching and resilient fallbacks.
 */
async function fetchUnsplashImage(query: string, fallback?: string, cacheKey?: string): Promise<string> {
  return fetchPremiumImage(query, {
    fallbackQuery: fallback,
    cacheKey: cacheKey
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Enrich raw AI output with real images
// ─────────────────────────────────────────────────────────────────────────────
async function enrichWithImages(raw: RawGuide): Promise<DestinationGuideData> {
  const dest = raw.destination;
  const heroImage = await fetchUnsplashImage(
    generateContextualQuery({ destination: dest, category: 'hero' }),
    `${dest} tourism landscape`
  );

  const [places, activities, hotels] = await Promise.all([
    Promise.all(
      raw.popularPlaces.map(async (p) => {
        const query = generateContextualQuery({ destination: dest, name: p.name, category: 'landmark' });
        return {
          ...p,
          image: await fetchUnsplashImage(p.imageQuery || query, query, `${dest}-${p.name}`),
        };
      })
    ),
    Promise.all(
      raw.activities.map(async (a) => {
        const query = generateContextualQuery({ destination: dest, name: a.name, category: 'activity', season: a.season });
        return {
          ...a,
          image: await fetchUnsplashImage(a.imageQuery || query, query, `${dest}-${a.name}`),
        };
      })
    ),
    Promise.all(
      raw.hotels.map(async (h) => {
        const query = generateContextualQuery({ destination: dest, name: h.name, category: 'stay' });
        return {
          ...h,
          image: await fetchUnsplashImage(h.imageQuery || query, query, `${dest}-${h.name}`),
        };
      })
    ),
  ]);

  return {
    ...raw,
    heroImage, // Attach the enriched hero image
    popularPlaces: places,
    activities,
    hotels,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback guide when AI fails — now with more comprehensive data
// ─────────────────────────────────────────────────────────────────────────────
function buildFallback(destination: string): DestinationGuideData {
  const isManali = destination.toLowerCase().includes('manali');
  
  const popularPlaces = isManali ? [
    { name: 'Solang Valley', description: 'Famed for adventure sports like paragliding and skiing with stunning mountain views.', imageQuery: 'Solang Valley Manali snow paragliding', image: FALLBACK_IMAGE, category: 'Adventure', rating: 4.8, duration: '4-5 hours', bestTime: 'Morning/Afternoon', tags: ['Adventure', 'Snow', 'Sports'], coordinates: { lat: 32.3166, lng: 77.1583 } },
    { name: 'Rohtang Pass', description: 'High mountain pass connecting Kullu Valley with Lahaul and Spiti Valleys.', imageQuery: 'Rohtang Pass Manali snow mountains', image: FALLBACK_IMAGE, category: 'Scenic Point', rating: 4.9, duration: '6-8 hours', bestTime: 'Early Morning', tags: ['Snow', 'Views', 'Drive'], coordinates: { lat: 32.3716, lng: 77.2435 } },
    { name: 'Hadimba Devi Temple', description: 'Ancient cave temple dedicated to Hidimbi Devi, surrounded by a cedar forest.', imageQuery: 'Hadimba Temple Manali forest', image: FALLBACK_IMAGE, category: 'Spiritual', rating: 4.7, duration: '1-2 hours', bestTime: 'Anytime', tags: ['Culture', 'Heritage', 'Peace'], coordinates: { lat: 32.2483, lng: 77.1772 } },
    { name: 'Old Manali', description: 'Charming area known for its cafes, local markets, and relaxed vibe.', imageQuery: 'Old Manali cafes river', image: FALLBACK_IMAGE, category: 'Culture', rating: 4.6, duration: '3-4 hours', bestTime: 'Evening', tags: ['Cafes', 'Vibe', 'Shopping'], coordinates: { lat: 32.2530, lng: 77.1751 } },
    { name: 'Jogini Waterfalls', description: 'Beautiful waterfall trek offering panoramic views of the Beas River.', imageQuery: 'Jogini Waterfall Manali trek', image: FALLBACK_IMAGE, category: 'Nature', rating: 4.8, duration: '3 hours', bestTime: 'Morning', tags: ['Trek', 'Waterfall', 'Nature'], coordinates: { lat: 32.2681, lng: 77.1895 } },
    { name: 'Mall Road', description: 'The bustling heart of Manali, perfect for shopping and local street food.', imageQuery: 'Mall Road Manali evening', image: FALLBACK_IMAGE, category: 'Shopping', rating: 4.5, duration: '2-3 hours', bestTime: 'Evening', tags: ['Shopping', 'Food', 'Crowd'], coordinates: { lat: 32.2431, lng: 77.1892 } }
  ] : [
    {
      name: 'City Center Market',
      description: 'The bustling heart of the city with local flavors and unique finds.',
      imageQuery: `${destination} market center`,
      image: FALLBACK_IMAGE,
      category: 'Shopping',
      rating: 4.5,
      duration: '2-3 hours',
      bestTime: 'Evening',
      tags: ['Local', 'Vibrant'],
      coordinates: { lat: 0, lng: 0 }
    },
    {
      name: 'Grand Landmark',
      description: 'An iconic site representing the heritage and spirit of the region.',
      imageQuery: `${destination} landmark heritage`,
      image: FALLBACK_IMAGE,
      category: 'Attraction',
      rating: 4.7,
      duration: '1-2 hours',
      bestTime: 'Afternoon',
      tags: ['History', 'Iconic'],
      coordinates: { lat: 0, lng: 0 }
    },
    {
      name: 'Scenic Lookout',
      description: 'A breathtaking vantage point offering panoramic views of the area.',
      imageQuery: `${destination} viewpoint panorama`,
      image: FALLBACK_IMAGE,
      category: 'Scenic Point',
      rating: 4.8,
      duration: '45 mins',
      bestTime: 'Sunset',
      tags: ['Views', 'Nature'],
      coordinates: { lat: 0, lng: 0 }
    }
  ];

  return {
    destination,
    hero: {
      title: `Explore ${destination}`,
      description: `Uncover the hidden gems and breathtaking landscapes of ${destination}.`,
    },
    quickFacts: {
      altitude: isManali ? '2050' : 'Altitude unavailable',
      bestTime: isManali ? 'October to June' : 'October to March',
      temperature: isManali ? '-5°C to 25°C' : '15°C to 25°C',
      location: isManali ? 'Himachal Pradesh, India' : 'State, India',
    },
    popularPlaces,
    activities: isManali ? [
      { name: 'Paragliding in Solang', description: 'Fly high over the Solang Valley and witness the snow-capped peaks.', price: '₹3000', location: 'Solang Valley', season: 'Summer', difficulty: 'Moderate', intensity: 'High', imageQuery: 'paragliding Manali mountains', image: FALLBACK_IMAGE, category: 'Adventure', rating: 4.8, duration: '1 hour', bestFor: ['Adrenaline Junkies'], timing: '9:00 AM - 4:00 PM' },
      { name: 'Skiing in Solang', description: 'Glide down the slopes of Solang Valley during the winter months.', price: '₹1500', location: 'Solang Valley', season: 'Winter', difficulty: 'Challenging', intensity: 'High', imageQuery: 'skiing Manali Solang', image: FALLBACK_IMAGE, category: 'Adventure', rating: 4.7, duration: '2 hours', bestFor: ['Families', 'Adventure Seekers'], timing: '10:00 AM - 4:00 PM' },
      { name: 'Beas River Rafting', description: 'Experience the thrill of whitewater rafting on the Beas River.', price: '₹1200', location: 'Kullu', season: 'Summer', difficulty: 'Moderate', intensity: 'High', imageQuery: 'river rafting Kullu Manali', image: FALLBACK_IMAGE, category: 'Adventure', rating: 4.6, duration: '1.5 hours', bestFor: ['Groups', 'Friends'], timing: '10:00 AM - 3:00 PM' },
      { name: 'Old Manali Cafe Crawl', description: 'Explore the vibrant food scene and relaxed vibe of Old Manali cafes.', price: '₹1000', location: 'Old Manali', season: 'All-Season', difficulty: 'Easy', intensity: 'Low', imageQuery: 'Old Manali cafes interior', image: FALLBACK_IMAGE, category: 'Culture', rating: 4.9, duration: '3 hours', bestFor: ['Couples', 'Solo Travelers'], timing: '11:00 AM - 11:00 PM' }
    ] : [
      {
        name: 'City Heritage Walk',
        description: 'Discover the hidden stories and architecture of the old city.',
        price: '₹500',
        location: 'Old City',
        season: 'All-Season',
        difficulty: 'Easy',
        intensity: 'Low',
        imageQuery: `${destination} sightseeing walk`,
        image: FALLBACK_IMAGE,
        category: 'Culture',
        rating: 4.5,
        duration: '2 hours',
        bestFor: ['Families', 'History Buffs'],
        timing: '8:00 AM - 11:00 AM'
      },
    ],
    hotels: isManali ? [
      { name: 'Span Resort & Spa', description: 'Luxury riverside resort offering elite amenities and stunning views.', type: 'Luxury Resort', priceRange: '₹15000 - ₹25000', rating: 4.9, imageQuery: 'Span Resort Manali riverside luxury', image: FALLBACK_IMAGE, amenities: ['Pool', 'Spa', 'Riverside', 'Gym'], bestFor: ['Couples', 'Families'], category: 'Stay', tags: ['Luxury', 'Riverside'] },
      { name: 'Zostel Manali (Old Manali)', description: 'The ultimate backpacker hub with a vibrant community and mountain views.', type: 'Backpacker Hostel', priceRange: '₹800 - ₹2500', rating: 4.7, imageQuery: 'Zostel Manali Old Manali mountain view', image: FALLBACK_IMAGE, amenities: ['Wifi', 'Cafe', 'Common Room', 'Tours'], bestFor: ['Solo Travelers', 'Friends'], category: 'Stay', tags: ['Budget', 'Vibe'] },
      { name: 'The Himalayan', description: 'Boutique castle-style hotel with a vintage charm and luxury feel.', type: 'Boutique Hotel', priceRange: '₹12000 - ₹18000', rating: 4.8, imageQuery: 'The Himalayan Manali castle hotel', image: FALLBACK_IMAGE, amenities: ['Pool', 'Fireplace', 'Garden', 'Restaurant'], bestFor: ['Couples', 'History Buffs'], category: 'Stay', tags: ['Boutique', 'Castle'] },
      { name: 'Apple Orchard Homestay', description: 'Cozy traditional stay nestled within private apple orchards.', type: 'Homestay', priceRange: '₹3000 - ₹5000', rating: 4.6, imageQuery: 'Manali homestay apple orchard', image: FALLBACK_IMAGE, amenities: ['Home Food', 'Orchard Walk', 'Quiet'], bestFor: ['Families', 'Remote Work'], category: 'Stay', tags: ['Local', 'Peaceful'] }
    ] : [
      {
        name: `${destination} Grand Hotel`,
        description: 'A centrally located stay with modern comforts and great service.',
        type: 'Mid-Range Hotel',
        priceRange: '₹4000 - ₹6000',
        rating: 4.4,
        imageQuery: `${destination} modern hotel exterior`,
        image: FALLBACK_IMAGE,
        amenities: ['Wifi', 'Breakfast', 'Parking'],
        bestFor: ['Families', 'Business'],
        category: 'Stay',
      },
    ],
    itinerary: [
      { day: 1, title: 'Arrival & Iconic Sights', places: [popularPlaces[0].name] },
      { day: 2, title: 'Local Culture & Markets', places: [popularPlaces[1]?.name || 'Local Market'] },
    ],
    rentals: [{ type: 'Scooter / Bike Rental', cost: '₹600' }],
    nearbyDestinations: isManali ? [{ name: 'Kasol', distance: '75 km' }, { name: 'Rohtang Pass', distance: '51 km' }] : [],
    travelTips: ['Carry valid ID', 'Respect local traditions', 'Check weather before transit'],
    packingGuide: ['Comfortable walking shoes', 'Layered clothing', 'Universal power adapter'],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export async function generateDestinationGuide(
  destination: string
): Promise<DestinationGuideData> {
  const cacheKey = destination.toLowerCase().trim();

  // ── 1. Check MongoDB cache ─────────────────────────────────────────────────
  try {
    await connectDB();
    const cached = await DestinationGuide.findOne({
      destination: { $regex: new RegExp('^' + cacheKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') },
    });

    if (cached && cached.data && Object.keys(cached.data).length > 0) {
      console.log('✅ Cache hit for:', destination);
      return cached.data as DestinationGuideData;
    }
  } catch (dbError) {
    console.warn('⚠️ MongoDB cache read failed:', dbError);
  }

  // ── 2. Generate with Gemini ────────────────────────────────────────────────
  try {
    console.log('🤖 Generating guide for:', destination);

    const { output } = await ai.generate({
      prompt: `
You are a professional travel guide API for premium destinations.
Generate a factually accurate, immersive travel guide for "${destination}".

STRICT RULES:
- All places, activities, hotels MUST be real and specific to "${destination}"
- imageQuery MUST be highly contextual and descriptive (e.g. "Solang Valley Manali snow paragliding adventure", "Old Manali cafe vibe river side")
- Exactly 8-12 popularPlaces (MUST include: famous attractions, hidden gems, local cafes, shopping areas, scenic spots)
- Exactly 12-15 activities:
  - Generate a diverse mix of Summer, Winter, and All-Season experiences.
  - Categories should include: Adventure, Relaxation, Culture, Food, Nature.
  - Include specific details like difficulty, intensity, and "best for" tags.
  - For snowy destinations (like Manali), ensure a strong split between summer trekking/paragliding and winter skiing/snowboarding.
- Exactly 12-15 hotels (Stay category):
  - Diversify accommodation types: Luxury Resorts, Boutique Hotels, Backpacker Hostels, Homestays, Cabins, Cottages, Glamping.
  - Include realistic priceRange (e.g. "₹800 - ₹2500" for hostels, "₹15000+" for luxury).
  - List 4-6 key amenities per stay.
  - Specify "bestFor" tags (e.g. Couples, Families, Solo Travelers, Remote Work).
  - Descriptions should be immersive and highlight the unique selling point.
- Itinerary: 3–5 days covering the most iconic and interesting places
- travelTips and packingGuide must be specific to "${destination}"'s climate and culture
- quickFacts.altitude MUST be the real altitude in METERS (e.g. "2050")
- quickFacts.temperature MUST be min and max temperature range (e.g. "12°C to 28°C")
- quickFacts.location MUST be formatted as "State, Country" (e.g. "Himachal Pradesh, India")
- EVERY item (place, activity, hotel) MUST include realistic lat/lng coordinates for "${destination}"
- popularPlaces categories: MUST use one of [Attraction, Cafe, Adventure, Spiritual, Food, Stay, Hidden Gem, Shopping, Scenic Point]
- Ratings should be realistic (4.2 to 4.9)
- duration should be realistic (e.g. "45 mins", "2-3 hours", "Full Day")
- descriptions: exactly 10-15 words, evocative and inviting.
      `,
      output: { schema: DestinationGuideSchema },
    });

    if (!output) throw new Error('Empty Gemini output');

    // ── 3. Enrich with Unsplash images ────────────────────────────────────────
    const enriched = await enrichWithImages(output);

    // ── 4. Persist to cache ───────────────────────────────────────────────────
    try {
      await connectDB();
      await DestinationGuide.findOneAndUpdate(
        { destination: cacheKey },
        { destination: cacheKey, data: enriched, updatedAt: new Date() },
        { upsert: true }
      );
    } catch (saveErr) {
      console.warn('⚠️ Cache save failed:', saveErr);
    }

    return enriched;
  } catch (error) {
    console.error('❌ Guide generation failed:', error);
    return buildFallback(destination);
  }
}
