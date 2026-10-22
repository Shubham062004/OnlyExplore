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
  vibeCategory: z.enum(['Beach', 'Alpine', 'Heritage', 'Urban', 'Nature']).optional(),
  hiddenGems: z.array(z.object({
    name: z.string(),
    description: z.string(),
    rating: z.number().optional(),
    imageQuery: z.string().optional(),
    bestTime: z.string().optional(),
  })).optional(),
  localFood: z.array(z.object({
    name: z.string(),
    dishType: z.string(),
    price: z.string().optional(),
    description: z.string(),
    topSpot: z.string().optional(),
    imageQuery: z.string().optional(),
  })).optional(),
  cafes: z.array(z.object({
    name: z.string(),
    vibe: z.string(),
    priceRange: z.string(),
    rating: z.number().optional(),
    address: z.string().optional(),
    imageQuery: z.string().optional(),
  })).optional(),
  nightlife: z.array(z.object({
    name: z.string(),
    type: z.string(),
    timing: z.string(),
    rating: z.number().optional(),
    imageQuery: z.string().optional(),
  })).optional(),
  shopping: z.array(z.object({
    name: z.string(),
    items: z.string(),
    bestFor: z.string(),
    location: z.string().optional(),
    imageQuery: z.string().optional(),
  })).optional(),
  events: z.array(z.object({
    name: z.string(),
    season: z.string(),
    description: z.string(),
    category: z.string().optional(),
  })).optional(),
  localTransport: z.array(z.object({
    mode: z.string(),
    estimatedCost: z.string(),
    tip: z.string(),
  })).optional(),
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
      if (cached && ((cached.popularPlaces && cached.popularPlaces.length > 0) || (cached.activities && cached.activities.length > 0))) {
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
        const data = mongoCached.guideData as DestinationGuideData;
        if ((data.popularPlaces && data.popularPlaces.length > 0) || (data.activities && data.activities.length > 0)) {
          console.log('💾 MongoDB Cache hit for guide:', destination);
          cacheService.set(redisKey, data, 30 * 60).catch(err => console.error("Redis write failed:", err));
          return data;
        }
        console.log('⚠️ Ignoring empty cached guide for:', destination);
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

      // ── Parallel enrichment: distance, sentiment, cafes, clusters ──────────
      console.log('🔄 Running enrichment pipeline in parallel...');
      const [distanceResults, sentimentResults, cafeResults, clusterResults] = await Promise.allSettled([
        // Travel distances for nearby destinations
        Promise.all(nearbyRaw.map(async (n) => {
          try {
            const travel = await PlacesService.getTravelInfo(destination, n.name);
            return { ...n, roadDistance: travel?.distance || 'Nearby', driveTime: travel?.duration || 'Various' };
          } catch {
            return { ...n, roadDistance: 'Nearby', driveTime: 'Various' };
          }
        })),
        // Sentiment reviews for top attractions
        Promise.all(
          attractions.slice(0, 5).map(async (a) => {
            try {
              const details = await PlacesService.getPlaceDetails(a.placeId);
              return { name: a.name, reviews: details?.reviews || [] };
            } catch {
              return { name: a.name, reviews: [] };
            }
          })
        ),
        // Nearby cafes
        Promise.all(
          attractions.slice(0, 3).map(a => PlacesService.fetchNearby(a.coordinates, 'cafe', 1000).catch(() => []))
        ),
        // Itinerary clustering
        PlacesService.optimizeItineraryDays(attractions, 3).catch(() => []),
      ]);

      const nearbyWithDistance = distanceResults.status === 'fulfilled' ? distanceResults.value : nearbyRaw.map(n => ({ ...n, roadDistance: 'Nearby', driveTime: 'Various' }));
      const topSpotsDetails = sentimentResults.status === 'fulfilled' ? sentimentResults.value : attractions.slice(0, 5).map(a => ({ name: a.name, reviews: [] }));
      const cafes = cafeResults.status === 'fulfilled' ? cafeResults.value.flat().slice(0, 5) : [];
      const dayClusters = clusterResults.status === 'fulfilled' ? clusterResults.value : [];

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
  - Day 1 Cluster: ${JSON.stringify(dayClusters[0]?.map((p: any) => p.name))}
  - Day 2 Cluster: ${JSON.stringify(dayClusters[1]?.map((p: any) => p.name))}
  - Day 3 Cluster: ${JSON.stringify(dayClusters[2]?.map((p: any) => p.name))}
- Nearby/Similar Cards: Enrich with contextual "vibeTags" (e.g. Backpacker Paradise, Snow Destination, Luxury Escape), "bestSeason", and "category".
- Preparation System:
  - Generate a SMART PACKING CHECKLIST categorized by [Clothing, Footwear, Electronics, Medicines, Documents, Hygiene, Gear].
  - Assign priorities (Essential/Recommended/Optional) to each item based on ${currentMonth} in ${destination}.
  - Provide PRACTICAL Travel Tips categorized by [Local Transport, Road Conditions, ATM/Network, Customs, Safety].
  - Include REAL safety alerts (Sudden weather changes, altitude sensitivity, network dead-zones).
- Ensure all timings, transport recommendations, and vibes are logically sound for ${currentMonth}.
- CRITICAL: Only use REAL place names from the data provided. Never invent generic names like "City Center Market" or "Heritage Walk".
        `,
        output: { schema: DestinationGuideSchema },
      });

      if (!output) throw new Error('Final synthesis failed');

      // ── 4. Parallel Travel Times Enrichment ─────────────────────────────────
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
                ).catch(() => null)
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

      // ── 5. Parallel: Image enrichment + Weather snapshot ───────────────────
      console.log('🖼️ Enriching images and weather in parallel...');
      const [enriched, weatherSnapshot] = await Promise.all([
        enrichWithImages(output),
        WeatherService.getWeatherForDestination(destination, brainstorm.center).catch(() => null),
      ]);

      // Filter out any generic/placeholder content the AI may have generated
      const filteredGuide = this.filterGenericContent(enriched);

      // ── 6. Save to Caches (Redis 30m, MongoDB 30d) ────────────────────────
      try {
        await connectDB();
        await DestinationCache.findOneAndUpdate(
          { destination: cacheKey },
          {
            destination: cacheKey,
            guideData: filteredGuide,
            hotels,
            restaurants: cafes,
            activities: filteredGuide.activities,
            weatherSnapshot,
            images: filteredGuide.heroImage ? [filteredGuide.heroImage] : [],
            coordinates: brainstorm.center,
            createdAt: new Date()
          },
          { upsert: true, new: true }
        );
        
        await cacheService.set(redisKey, filteredGuide, 30 * 60); // 30 minutes in Redis
      } catch (saveErr) {
        console.warn('⚠️ Cache storage failed:', saveErr);
      }

      return filteredGuide;
    } catch (error) {
      console.error('❌ Guide generation failed:', error);
      return this.buildFallback(destination);
    }
  }

  /**
   * Filters out obviously generic/placeholder place names from AI-generated data.
   * Called before returning any guide data to ensure quality.
   */
  static filterGenericContent(guide: DestinationGuideData): DestinationGuideData {
    const genericPatterns = [
      /^city center market$/i,
      /^heritage walk$/i,
      /^unnamed location$/i,
      /^local market$/i,
      /^scenic point$/i,
    ];

    const isGeneric = (name: string): boolean => {
      if (!name) return true;
      return genericPatterns.some(pattern => pattern.test(name.trim()));
    };

    // Also reject hotel names that are just "${destination} Hotel"
    const destLower = guide.destination.toLowerCase();
    const isGenericHotel = (name: string): boolean => {
      if (!name) return true;
      const lower = name.toLowerCase().trim();
      return lower === `${destLower} hotel` || lower === 'hotel' || lower === 'stay';
    };

    return {
      ...guide,
      popularPlaces: guide.popularPlaces.filter(p => !isGeneric(p.name)),
      activities: guide.activities.filter(a => !isGeneric(a.name)),
      hotels: guide.hotels.filter(h => !isGenericHotel(h.name)),
      rentals: guide.rentals.filter(r => r.name && r.name.length > 3),
    };
  }

  /**
   * Builds a minimal, honest fallback when guide generation fails.
   * 
   * KEY PRINCIPLE: Never display fake content. If we can't fetch real data,
   * show "Currently unavailable" and empty arrays. The UI will handle
   * empty states gracefully rather than showing misleading fake attractions.
   */
  static buildFallback(destination: string): DestinationGuideData {
    return {
      destination,
      hero: {
        title: `Explore ${destination}`,
        description: `Discover the unique experiences and hidden gems of ${destination}. Our AI is preparing a comprehensive guide for you.`,
      },
      quickFacts: {
        altitude: 'Currently unavailable',
        bestTime: 'Currently unavailable',
        temperature: 'Currently unavailable',
        location: 'Currently unavailable',
      },
      popularPlaces: [],
      activities: [],
      hotels: [],
      itinerary: [],
      rentals: [],
      nearbyDestinations: [],
      similarDestinations: [],
      travelTips: [{ category: 'General', tips: ['Check local travel advisories before your trip', 'Carry valid identification at all times'] }],
      packingGuide: [{ category: 'Essentials', items: [{ name: 'Valid ID / Passport', priority: 'Essential' }, { name: 'Comfortable walking shoes', priority: 'Essential' }] }],
      safetyAlerts: [{ type: 'Safety', message: 'Always verify local conditions and travel advisories before departure.', severity: 'Low' }],
    };
  }
}
export default DestinationService;

