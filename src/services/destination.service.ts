import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { connectDB } from '@/lib/mongodb';
import DestinationCache from '@/models/DestinationCache';
import { cacheService } from './cache.service';
import { PlacesService, RealPlace } from './places.service';
import { WeatherService } from './weather.service';
import { ImageService } from './image.service';
import { MapService } from './map.service';
import { format } from 'date-fns';

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
    category: z.string(),
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
  nearbyDestinations: z.array(z.object({
    name: z.string(),
    state: z.string().optional(),
    roadDistance: z.string().optional(),
    driveTime: z.string().optional(),
    category: z.string().optional(),
    vibeTags: z.array(z.string()).optional(),
    bestSeason: z.string().optional(),
    imageQuery: z.string().optional(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  })),
  similarDestinations: z.array(z.object({
    name: z.string(),
    state: z.string().optional(),
    roadDistance: z.string().optional(),
    driveTime: z.string().optional(),
    category: z.string().optional(),
    vibeTags: z.array(z.string()).optional(),
    bestSeason: z.string().optional(),
    imageQuery: z.string().optional(),
    coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  })),
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
  category: string;
  tags?: string[];
  coordinates?: { lat: number; lng: number };
}

export interface DestinationGuideData extends Omit<RawGuide, 'popularPlaces' | 'activities' | 'hotels' | 'rentals' | 'nearbyDestinations' | 'similarDestinations'> {
  heroImage?: string;
  popularPlaces: EnrichedPlace[];
  activities: EnrichedActivity[];
  hotels: EnrichedHotel[];
  rentals: (RawGuide['rentals'][0] & { image: string })[];
  nearbyDestinations: (RawGuide['nearbyDestinations'][0] & { image: string })[];
  similarDestinations: (RawGuide['similarDestinations'][0] & { image: string })[];
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop';

async function enrichWithImages(raw: RawGuide): Promise<DestinationGuideData> {
  const dest = raw.destination;
  
  const [
    heroImage,
    landmarkImages,
    activityImages,
    hotelImages,
    rentalImages,
    natureImages
  ] = await Promise.all([
    ImageService.fetchPremiumImage(`${dest} landscape`, { forceFresh: true }),
    ImageService.fetchBulkPremiumImages(`${dest} landmark`, 15),
    ImageService.fetchBulkPremiumImages(`${dest} adventure`, 15),
    ImageService.fetchBulkPremiumImages(`${dest} hotel`, 10),
    ImageService.fetchBulkPremiumImages(`${dest} vehicle`, 10),
    ImageService.fetchBulkPremiumImages(`${dest} nature`, 10),
  ]);

  const popImage = (arr: string[], fallbackUrl: string) => {
    if (arr && arr.length > 0) {
      const img = arr.shift();
      if (img) arr.push(img);
      return img || fallbackUrl;
    }
    return fallbackUrl;
  };

  const places = raw.popularPlaces.map(p => ({
    ...p,
    image: popImage(landmarkImages, heroImage)
  }));

  const activities = raw.activities.map(a => ({
    ...a,
    image: popImage(activityImages, heroImage)
  }));

  const hotels = raw.hotels.map(h => ({
    ...h,
    image: popImage(hotelImages, heroImage)
  }));

  const rentals = (raw.rentals || []).map(r => ({
    ...r,
    image: popImage(rentalImages, heroImage)
  }));

  const nearby = (raw.nearbyDestinations || []).map(n => ({
    ...n,
    image: popImage(natureImages, heroImage)
  }));

  const similar = (raw.similarDestinations || []).map(s => ({
    ...s,
    image: popImage(landmarkImages, heroImage)
  }));

  return {
    ...raw,
    heroImage,
    popularPlaces: places,
    activities,
    hotels,
    rentals,
    nearbyDestinations: nearby,
    similarDestinations: similar,
  };
}

export class DestinationService {
  static async generateDestinationGuide(
    destination: string,
    tripType: 'General' | 'Couple' | 'Family' | 'Solo' | 'Luxury' | 'Adventure' = 'General'
  ): Promise<DestinationGuideData> {
    const cacheKey = destination.toLowerCase().trim();
    const redisKey = `guide:${cacheKey}`;
    const currentMonth = format(new Date(), 'MMMM');

    // ── 1. Check Redis Cache ─────────────────────────────────────────────────
    try {
      const cached = await cacheService.get<DestinationGuideData>(redisKey);
      if (cached) {
        console.log('⚡ Redis Cache hit for guide:', destination);
        return cached;
      }
    } catch (e) {
      console.warn('⚠️ Redis read error:', e);
    }

    // ── 2. Check MongoDB DestinationCache ────────────────────────────────────
    try {
      await connectDB();
      const mongoCached = await DestinationCache.findOne({ destination: cacheKey });
      if (mongoCached && mongoCached.guideData) {
        console.log('💾 MongoDB Cache hit for guide:', destination);
        const data = mongoCached.guideData as DestinationGuideData;
        
        // Asynchronously populate Redis cache
        cacheService.set(redisKey, data, 30 * 60).catch(err => console.error("Redis write failed:", err));
        return data;
      }
    } catch (dbError) {
      console.warn('⚠️ MongoDB cache read failed:', dbError);
    }

    // ── 3. Generate Guide Data ────────────────────────────────────────────────
    try {
      console.log('🤖 Brainstorming intelligence for:', destination, `(Season: ${currentMonth})`);

      const { output: brainstorm } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
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

      // Fetch Place data in parallel
      console.log('🔍 Fetching real-world data from Google Places...');
      const [realAttractions, realHotels, realRentals, realNearby, realSimilar] = await Promise.all([
        Promise.all(brainstorm.attractionNames.slice(0, 10).map(name => PlacesService.searchPlaces(`${name} ${destination}`, brainstorm.center))),
        Promise.all(brainstorm.hotelNames.slice(0, 10).map(name => PlacesService.searchPlaces(`${name} ${destination}`, brainstorm.center))),
        Promise.all(brainstorm.rentalNames.slice(0, 6).map(name => PlacesService.searchPlaces(`${name} ${destination}`, brainstorm.center))),
        Promise.all(brainstorm.nearbyNames.slice(0, 6).map(name => PlacesService.searchPlaces(name, brainstorm.center))),
        Promise.all(brainstorm.similarNames.slice(0, 6).map(name => PlacesService.searchPlaces(name))),
      ]);

      const attractions = realAttractions.flat().filter((p, i, self) => self.findIndex(t => t.placeId === p.placeId) === i).slice(0, 10);
      const hotels = realHotels.flat().filter((p, i, self) => self.findIndex(t => t.placeId === p.placeId) === i).slice(0, 10);
      const rentals = realRentals.flat().filter((p, i, self) => self.findIndex(t => t.placeId === p.placeId) === i).slice(0, 6);
      const nearbyRaw = realNearby.flat().filter((p, i, self) => self.findIndex(t => t.placeId === p.placeId) === i).slice(0, 6);
      const similarRaw = realSimilar.flat().filter((p, i, self) => self.findIndex(t => t.placeId === p.placeId) === i).slice(0, 6);

      // Travel distance info (parallel execution)
      console.log('🚗 Calculating real road distances for nearby destinations...');
      const nearbyWithDistance = await Promise.all(nearbyRaw.map(async (n) => {
        const travel = await PlacesService.getTravelInfo(destination, n.name);
        return {
          ...n,
          roadDistance: travel?.distance || 'Nearby',
          driveTime: travel?.duration || 'Various'
        };
      }));

      // Sentiment reviews (parallel execution)
      console.log('📝 Extracting real visitor sentiment for top spots...');
      const topSpotsDetails = await Promise.all(
        attractions.slice(0, 5).map(async (a) => {
          const details = await PlacesService.getPlaceDetails(a.placeId);
          return { name: a.name, reviews: details?.reviews || [] };
        })
      );

      // Nearby context cafes (parallel execution)
      console.log('📍 Discovering local neighborhood context...');
      const nearbyCafes = await Promise.all(
        attractions.slice(0, 3).map(a => PlacesService.fetchNearby(a.coordinates, 'cafe', 1000))
      );
      const cafes = nearbyCafes.flat().slice(0, 5);

      // Optimize itinerary clustering
      console.log('🗺️ Optimizing itinerary clusters...');
      const dayClusters = await PlacesService.optimizeItineraryDays(attractions, 3);

      // Final Synthesized synthesis
      console.log(`✍️ Finalizing ${tripType}-focused guide with deep real data...`);
      const { output } = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
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

      // ── 4. Parallel Travel Times Enrichment (FIX SEQUENTIAL WATERFALL) ──────
      console.log('⏱️ Enriching itinerary with real travel times in parallel...');
      if (output.itinerary) {
        const travelPromises: Promise<any>[] = [];
        const scheduleItemsToUpdate: { current: any; next: any }[] = [];

        for (const day of output.itinerary) {
          if (day.schedule && day.schedule.length > 1) {
            for (let i = 0; i < day.schedule.length - 1; i++) {
              const current = day.schedule[i];
              const next = day.schedule[i + 1];
              scheduleItemsToUpdate.push({ current, next });
              
              const mode = current.transport?.toLowerCase().includes('walk') ? 'walking' : 'driving';
              travelPromises.push(
                PlacesService.getTravelInfo(
                  `${current.activity} ${destination}`,
                  `${next.activity} ${destination}`,
                  mode
                )
              );
            }
          }
        }

        const travelResults = await Promise.all(travelPromises);
        for (let idx = 0; idx < travelResults.length; idx++) {
          const travel = travelResults[idx];
          if (travel) {
            const { current, next } = scheduleItemsToUpdate[idx];
            current.details = `${current.details} (Travel: ${travel.duration} to ${next.activity})`.slice(0, 150);
          }
        }
      }

      // Enrich with optimized images
      const enriched = await enrichWithImages(output);

      // Fetch Weather Snapshot to store in Cache
      const weatherSnapshot = await WeatherService.getWeatherForDestination(destination, brainstorm.center);

      // ── 5. Save to Caches (Redis 30m, MongoDB 30d) ────────────────────────
      try {
        await connectDB();
        await DestinationCache.findOneAndUpdate(
          { destination: cacheKey },
          {
            destination: cacheKey,
            guideData: enriched,
            hotels,
            restaurants: cafes,
            activities: enriched.activities,
            weatherSnapshot,
            images: enriched.heroImage ? [enriched.heroImage] : [],
            coordinates: brainstorm.center,
            createdAt: new Date()
          },
          { upsert: true, new: true }
        );
        
        await cacheService.set(redisKey, enriched, 30 * 60); // 30 minutes in Redis
      } catch (saveErr) {
        console.warn('⚠️ Cache storage failed:', saveErr);
      }

      return enriched;
    } catch (error) {
      console.error('❌ Guide generation failed:', error);
      return this.buildFallback(destination);
    }
  }

  static buildFallback(destination: string): DestinationGuideData {
    const isManali = destination.toLowerCase().includes('manali');
    const popularPlaces = isManali ? [
      { name: 'Solang Valley', description: 'Famed for adventure sports like paragliding and skiing with stunning mountain views.', imageQuery: 'Solang Valley Manali snow paragliding', image: FALLBACK_IMAGE, category: 'Adventure', rating: 4.8, duration: '4-5 hours', bestTime: 'Morning/Afternoon', tags: ['Adventure', 'Snow', 'Sports'], coordinates: { lat: 32.3166, lng: 77.1583 } },
      { name: 'Rohtang Pass', description: 'High mountain pass connecting Kullu Valley with Lahaul and Spiti Valleys.', imageQuery: 'Rohtang Pass Manali snow mountains', image: FALLBACK_IMAGE, category: 'Scenic Point', rating: 4.9, duration: '6-8 hours', bestTime: 'Early Morning', tags: ['Snow', 'Views', 'Drive'], coordinates: { lat: 32.3716, lng: 77.2435 } },
      { name: 'Hadimba Devi Temple', description: 'Ancient cave temple dedicated to Hidimbi Devi, surrounded by a cedar forest.', imageQuery: 'Hadimba Temple Manali forest', image: FALLBACK_IMAGE, category: 'Spiritual', rating: 4.7, duration: '1-2 hours', bestTime: 'Anytime', tags: ['Culture', 'Heritage', 'Peace'], coordinates: { lat: 32.2483, lng: 77.1772 } }
    ] : [
      { name: 'City Center Market', description: 'The bustling heart of the city with local flavors.', imageQuery: `${destination} market center`, image: FALLBACK_IMAGE, category: 'Shopping', rating: 4.5, duration: '2-3 hours', bestTime: 'Evening', tags: ['Local', 'Vibrant'], coordinates: { lat: 0, lng: 0 } }
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
      activities: [
        { name: 'Heritage Walk', description: 'Discover local heritage.', price: '₹500', location: 'Old City', season: 'All-Season', difficulty: 'Easy', intensity: 'Low', imageQuery: `${destination} walk`, image: FALLBACK_IMAGE, category: 'Culture', rating: 4.5, duration: '2 hours' }
      ],
      hotels: [
        { name: `${destination} Hotel`, description: 'Centrally located comfortable stay.', type: 'Mid-Range', priceRange: '₹3000 - ₹5000', rating: 4.5, imageQuery: 'hotel', image: FALLBACK_IMAGE, amenities: ['Wifi'], bestFor: ['Families'], category: 'Stay' }
      ],
      itinerary: [
        { day: 1, title: 'Arrival & Sightseeing', places: [popularPlaces[0].name], vibe: 'Relaxed', duration: '6 hours', schedule: [{ time: '10:00 AM', activity: 'Arrival', details: 'Check-in and refresh.' }] }
      ],
      rentals: [{ name: 'Bike Rental', type: 'Bike', cost: '₹800/day', rating: 4.5, location: 'Center', bestFor: 'Transit', imageQuery: 'bike', image: FALLBACK_IMAGE }],
      nearbyDestinations: [],
      similarDestinations: [],
      travelTips: [{ category: 'General', tips: ['Carry ID card'] }],
      packingGuide: [{ category: 'Essentials', items: [{ name: 'Walking shoes', priority: 'Essential' }] }],
      safetyAlerts: [{ type: 'Weather', message: 'Check conditions.', severity: 'Low' }],
    };
  }
}
export default DestinationService;
