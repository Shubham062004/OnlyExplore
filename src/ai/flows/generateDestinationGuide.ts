'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { connectDB } from '@/lib/mongodb';
import DestinationGuide from '@/models/DestinationGuide';
import { fetchPremiumImage, generateContextualQuery } from '@/lib/imageService';
import { DestinationService, RealPlace } from '@/lib/destinationService';
import { format } from 'date-fns';

// ─────────────────────────────────────────────────────────────────────────────
// Schema — imageQuery on every visual item; image is attached after fetch
// ─────────────────────────────────────────────────────────────────────────────
const DestinationRecommendationSchema = z.object({
  name: z.string(),
  state: z.string().optional(),
  roadDistance: z.string().optional(),
  driveTime: z.string().optional(),
  category: z.string().optional(),
  vibeTags: z.array(z.string()).optional(),
  bestSeason: z.string().optional(),
  imageQuery: z.string().optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
});

const DestinationGuideSchema = z.object({
  destination: z.string(),
  hero: z.object({
    title: z.string(),
    description: z.string(),
  }).optional(),
  quickFacts: z.object({
    altitude: z.string().optional(),
    bestTime: z.string(),
    temperature: z.string().optional(),
    location: z.string(),
  }),
  popularPlaces: z.array(z.object({
    name: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    imageQuery: z.string(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
    category: z.string().optional(),
    rating: z.number().optional(),
    duration: z.string().optional(),
    bestTime: z.string().optional(),
  })),
  activities: z.array(z.object({
    name: z.string(),
    description: z.string(),
    price: z.string().optional(),
    location: z.string().optional(),
    season: z.enum(['Summer', 'Winter', 'All-Season']),
    difficulty: z.enum(['Easy', 'Moderate', 'Challenging']),
    intensity: z.enum(['Low', 'Medium', 'High']),
    imageQuery: z.string(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
    category: z.string(),
    rating: z.number().optional(),
    duration: z.string().optional(),
    bestFor: z.array(z.string()).optional(),
    timing: z.string().optional(),
  })),
  hotels: z.array(z.object({
    name: z.string(),
    description: z.string(),
    type: z.string(),
    priceRange: z.string(),
    rating: z.number().optional(),
    imageQuery: z.string(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
    amenities: z.array(z.string()),
    bestFor: z.array(z.string()),
    category: z.literal('Stay'),
    tags: z.array(z.string()).optional(),
  })),
  itinerary: z.array(z.object({
    day: z.number(),
    title: z.string(),
    places: z.array(z.string()),
    vibe: z.enum(['Relaxed', 'Adventure-packed', 'Cultural', 'Scenic']),
    duration: z.string(),
    schedule: z.array(z.object({
      time: z.string(),
      activity: z.string(),
      duration: z.string().optional(),
      transport: z.string().optional(),
      details: z.string(),
    })),
  })).optional(),
  rentals: z.array(z.object({
    name: z.string(),
    type: z.enum(['Bike', 'Scooter', 'Cab', 'Self Drive', 'Adventure Gear', 'Trekking Guide']),
    cost: z.string(),
    rating: z.number(),
    location: z.string(),
    bestFor: z.string(),
    imageQuery: z.string(),
  })),
  nearbyDestinations: z.array(DestinationRecommendationSchema),
  similarDestinations: z.array(DestinationRecommendationSchema),
  travelTips: z.array(z.object({
    category: z.string(),
    tips: z.array(z.string()),
  })),
  packingGuide: z.array(z.object({
    category: z.string(),
    items: z.array(z.object({
      name: z.string(),
      priority: z.enum(['Essential', 'Recommended', 'Optional']),
    })),
  })),
  safetyAlerts: z.array(z.object({
    type: z.enum(['Weather', 'Altitude', 'Transit', 'Safety']),
    message: z.string(),
    severity: z.enum(['Low', 'Medium', 'High']),
  })),
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
      { 
        day: 1, 
        title: 'Arrival & Iconic Sights', 
        places: [popularPlaces[0].name],
        vibe: 'Relaxed',
        duration: '8 hours',
        schedule: [
          { time: '09:00 AM', activity: 'Arrival & Hotel Check-in', transport: 'Cab', details: 'Check into your stay and freshen up for the adventure.' },
          { time: '11:00 AM', activity: `Explore ${popularPlaces[0].name}`, transport: 'Walking', details: 'Visit the most iconic landmark of the destination.' },
        ]
      },
    ],
    rentals: [{ name: 'Local Bike Hub', type: 'Bike', cost: '₹800/day', rating: 4.5, location: 'City Center', bestFor: 'Mountain exploration', imageQuery: 'Royal Enfield bike' }],
    nearbyDestinations: isManali ? [{ name: 'Kasol', distance: '75 km' }, { name: 'Rohtang Pass', distance: '51 km' }] : [],
    travelTips: ['Carry valid ID', 'Respect local traditions', 'Check weather before transit'],
    packingGuide: ['Comfortable walking shoes', 'Layered clothing', 'Universal power adapter'],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export async function generateDestinationGuide(
  destination: string,
  tripType: 'General' | 'Couple' | 'Family' | 'Solo' | 'Luxury' | 'Adventure' = 'General'
): Promise<DestinationGuideData> {
  const cacheKey = destination.toLowerCase().trim();
  const currentMonth = format(new Date(), 'MMMM');

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

  // ── 2. Stage 1: Intelligence Brainstorming (Gemini) ────────────────────────
  try {
    console.log('🤖 Brainstorming intelligence for:', destination, `(Season: ${currentMonth})`);

    const { output: brainstorm } = await ai.generate({
      prompt: `
You are a high-level travel strategist. 
For "${destination}" in ${currentMonth}, identify:
1. The exact coordinates (Lat/Lng) of the destination center.
2. A list of 10-15 REAL names of top attractions and hidden gems.
3. A list of 10-15 REAL names of best hotels/hostels across all budgets.
4. A list of 5-8 REAL names of local rental businesses (Bike, Cab, Gear).
5. A list of 10 REAL activities suited for ${currentMonth}.
6. A list of 5-8 REAL nearby destinations (geographically close, road-trip relevant).
7. A list of 5-8 REAL similar destinations globally (similar vibe, mountain/beach type).

STRICT RULES:
- Only return REAL, verified businesses and locations.
- No generic filler names.
- Focus on what's active and best in ${currentMonth}.
      `,
      output: { 
        schema: z.object({
          center: z.object({ lat: z.number(), lng: z.number() }),
          attractionNames: z.array(z.string()),
          hotelNames: z.array(z.string()),
          rentalNames: z.array(z.string()),
          activityNames: z.array(z.string()),
          nearbyNames: z.array(z.string()),
          similarNames: z.array(z.string()),
        }) 
      },
    });

    if (!brainstorm) throw new Error('Brainstorming failed');

    // ── 3. Stage 2: Real-World Data Enrichment (Google Places) ────────────────
    console.log('🔍 Fetching real-world data from Google Places...');
    
    const [realAttractions, realHotels, realRentals, realNearby, realSimilar] = await Promise.all([
      Promise.all(brainstorm.attractionNames.slice(0, 10).map(name => DestinationService.searchPlaces(`${name} ${destination}`, brainstorm.center))),
      Promise.all(brainstorm.hotelNames.slice(0, 10).map(name => DestinationService.searchPlaces(`${name} ${destination}`, brainstorm.center))),
      Promise.all(brainstorm.rentalNames.slice(0, 6).map(name => DestinationService.searchPlaces(`${name} ${destination}`, brainstorm.center))),
      Promise.all(brainstorm.nearbyNames.slice(0, 6).map(name => DestinationService.searchPlaces(name, brainstorm.center))),
      Promise.all(brainstorm.similarNames.slice(0, 6).map(name => DestinationService.searchPlaces(name))),
    ]);

    // Flatten and clean
    const rentals = realRentals.flat().filter((p, i, self) => self.findIndex(t => t.placeId === p.placeId) === i).slice(0, 6);
    const nearbyRaw = realNearby.flat().filter((p, i, self) => self.findIndex(t => t.placeId === p.placeId) === i).slice(0, 6);
    const similarRaw = realSimilar.flat().filter((p, i, self) => self.findIndex(t => t.placeId === p.placeId) === i).slice(0, 6);

    // ── 4. Stage 2.1: Real Distance Enrichment (Distance Matrix) ──────────────
    console.log('🚗 Calculating real road distances for nearby destinations...');
    const nearbyWithDistance = await Promise.all(nearbyRaw.map(async (n) => {
      const travel = await DestinationService.getTravelInfo(destination, n.name);
      return {
        ...n,
        roadDistance: travel?.distance || 'Nearby',
        driveTime: travel?.duration || 'Various'
      };
    }));

    // ── 5. Stage 2.5: Deep Detail & Review Enrichment ────────────────────────
    console.log('📝 Extracting real visitor sentiment for top spots...');
    const topSpotsDetails = await Promise.all(
      attractions.slice(0, 5).map(async (a) => {
        const details = await DestinationService.getPlaceDetails(a.placeId);
        return { name: a.name, reviews: details?.reviews || [] };
      })
    );

    // ── 5. Stage 2.6: Nearby Contextual Discovery (Cafes/POIs) ────────────────
    console.log('📍 Discovering local neighborhood context...');
    const nearbyCafes = await Promise.all(
      attractions.slice(0, 3).map(a => DestinationService.fetchNearby(a.coordinates, 'cafe', 1000))
    );
    const cafes = nearbyCafes.flat().slice(0, 5);

    // ── 6. Stage 3: Itinerary Optimization ─────────────────────────────────────
    console.log('🗺️ Optimizing itinerary clusters...');
    const dayClusters = await DestinationService.optimizeItineraryDays(attractions, 3);

    // ── 7. Stage 4: Final Assembly (Gemini) ────────────────────────────────────
    console.log(`✍️ Finalizing ${tripType}-focused guide with deep real data...`);
    const { output } = await ai.generate({
      prompt: `
Synthesize a premium travel guide for "${destination}" specifically for a ${tripType} trip using this REAL-WORLD data:
- Center: ${JSON.stringify(brainstorm.center)}
- Attractions & Sentiment: ${JSON.stringify(topSpotsDetails)}
- All Attractions: ${JSON.stringify(attractions.map(a => ({ name: a.name, rating: a.rating, coords: a.coordinates })))}
- Nearby Cafes: ${JSON.stringify(cafes.map(c => ({ name: c.name, rating: c.rating })))}
- Nearby Destinations: ${JSON.stringify(nearbyWithDistance.map(n => ({ name: n.name, dist: n.roadDistance, time: n.driveTime })))}
- Similar Destinations: ${JSON.stringify(similarRaw.map(s => ({ name: s.name })))}
- Hotels: ${JSON.stringify(hotels.map(h => ({ name: h.name, rating: h.rating, coords: h.coordinates })))}
- Rentals: ${JSON.stringify(rentals.map(r => ({ name: r.name, rating: r.rating })))}

REQUIREMENTS:
- Descriptions: Generate context-aware descriptions based on the provided visitor sentiment (reviews). Avoid generic filler.
- Itinerary: Create a 3-day itinerary tailored for a ${tripType} traveler.
  - Day 1 Cluster: ${JSON.stringify(dayClusters[0]?.map(p => p.name))}
  - Day 2 Cluster: ${JSON.stringify(dayClusters[1]?.map(p => p.name))}
  - Day 3 Cluster: ${JSON.stringify(dayClusters[2]?.map(p => p.name))}
- Nearby/Similar Cards: Enrich with contextual "vibeTags" (e.g. Backpacker Paradise, Snow Destination, Luxury Escape), "bestSeason", and "category".
- Preparation System:
  - Generate a SMART PACKING CHECKLIST categorized by [Clothing, Footwear, Electronics, Medicines, Documents, Hygiene, Gear].
  - Assign priorities (Essential/Recommended/Optional) to each item based on ${currentMonth} in ${destination}.
  - Provide PRACTICAL Travel Tips categorized by [Local Transport, Road Conditions, ATM/Network, Customs, Safety].
  - Include REAL safety alerts (Sudden weather changes, altitude sensitivity, network dead-zones).
- Ensure all timings, transport recommendations, and vibes are logically sound for ${currentMonth}.
      `,
      output: { schema: DestinationGuideSchema },
    });

    if (!output) throw new Error('Final synthesis failed');

    // ── 6. Stage 5: Real Travel Time Enrichment ───────────────────────────────
    console.log('⏱️ Enriching itinerary with real travel times...');
    if (output.itinerary) {
      for (const day of output.itinerary) {
        if (day.schedule && day.schedule.length > 1) {
          for (let i = 0; i < day.schedule.length - 1; i++) {
            const current = day.schedule[i];
            const next = day.schedule[i+1];
            
            // Try to find the real travel info
            try {
              const travel = await DestinationService.getTravelInfo(
                `${current.activity} ${destination}`,
                `${next.activity} ${destination}`,
                current.transport?.toLowerCase().includes('walk') ? 'walking' : 'driving'
              );
              
              if (travel) {
                // Update the current item to mention travel to next
                current.details = `${current.details} (Travel: ${travel.duration} to ${next.activity})`.slice(0, 150);
              }
            } catch (e) {
              console.warn(`Travel enrichment failed for ${current.activity} -> ${next.activity}`);
            }
          }
        }
      }
    }
    // ── 6. Enrich with Unsplash images ────────────────────────────────────────
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
