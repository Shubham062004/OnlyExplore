'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { connectDB } from '@/lib/mongodb';
import DestinationGuide from '@/models/DestinationGuide';

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
    altitude: z.string().optional(),
    bestTime: z.string(),
    avgTemp: z.string().optional(),
    location: z.string(),
  }),
  popularPlaces: z.array(z.object({
    name: z.string(),
    description: z.string().describe('max 15 words'),
    bestFor: z.array(z.string()).optional(),
    imageQuery: z.string().describe('specific Unsplash query e.g. "Solang Valley Manali snow"'),
  })),
  activities: z.array(z.object({
    name: z.string(),
    price: z.string().optional().describe('e.g. ₹1500'),
    location: z.string().optional(),
    bestSeason: z.string().optional(),
    imageQuery: z.string().describe('specific Unsplash query e.g. "paragliding Manali mountains"'),
  })),
  hotels: z.array(z.object({
    name: z.string(),
    type: z.string(),
    price: z.string().optional().describe('e.g. ₹4200/night'),
    rating: z.number().optional().describe('0-5'),
    imageQuery: z.string().describe('specific Unsplash query e.g. "Manali luxury hotel mountain view"'),
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
  bestFor?: string[];
  imageQuery: string;
  image: string;
}

export interface EnrichedActivity {
  name: string;
  price?: string;
  location?: string;
  bestSeason?: string;
  imageQuery: string;
  image: string;
}

export interface EnrichedHotel {
  name: string;
  type: string;
  price?: string;
  rating?: number;
  imageQuery: string;
  image: string;
}

export interface DestinationGuideData extends Omit<RawGuide, 'popularPlaces' | 'activities' | 'hotels'> {
  popularPlaces: EnrichedPlace[];
  activities: EnrichedActivity[];
  hotels: EnrichedHotel[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Unsplash image fetcher
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop';

async function fetchUnsplashImage(query: string): Promise<string> {
  const accessKey =
    process.env.UNSPLASH_ACCESS_KEY ||
    process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ||
    '';
  if (!accessKey) return FALLBACK_IMAGE;

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&per_page=1&orientation=landscape&client_id=${accessKey}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return FALLBACK_IMAGE;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Enrich raw AI output with real images
// ─────────────────────────────────────────────────────────────────────────────
async function enrichWithImages(raw: RawGuide): Promise<DestinationGuideData> {
  const [places, activities, hotels] = await Promise.all([
    Promise.all(
      raw.popularPlaces.map(async (p) => ({
        ...p,
        image: await fetchUnsplashImage(p.imageQuery),
      }))
    ),
    Promise.all(
      raw.activities.map(async (a) => ({
        ...a,
        image: await fetchUnsplashImage(a.imageQuery),
      }))
    ),
    Promise.all(
      raw.hotels.map(async (h) => ({
        ...h,
        image: await fetchUnsplashImage(h.imageQuery),
      }))
    ),
  ]);

  return {
    ...raw,
    popularPlaces: places,
    activities,
    hotels,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback guide when AI fails
// ─────────────────────────────────────────────────────────────────────────────
function buildFallback(destination: string): DestinationGuideData {
  return {
    destination,
    hero: {
      title: `Explore ${destination}`,
      description: `Uncover the hidden gems and breathtaking landscapes of ${destination}.`,
    },
    quickFacts: {
      altitude: 'Varies',
      bestTime: 'October to March',
      avgTemp: '20°C',
      location: 'India',
    },
    popularPlaces: [
      {
        name: 'Main Market',
        description: 'The heart of the city with dozens of local shops.',
        bestFor: ['Shopping', 'Culture'],
        imageQuery: `${destination} market`,
        image: FALLBACK_IMAGE,
      },
    ],
    activities: [
      {
        name: 'City Tour',
        price: '₹500',
        location: 'City Centre',
        bestSeason: 'Any',
        imageQuery: `${destination} sightseeing`,
        image: FALLBACK_IMAGE,
      },
    ],
    hotels: [
      {
        name: `${destination} Grand Hotel`,
        type: 'Luxury',
        price: '₹4200/night',
        rating: 4.5,
        imageQuery: `${destination} luxury hotel`,
        image: FALLBACK_IMAGE,
      },
    ],
    itinerary: [
      { day: 1, title: 'Arrival & Local Exploration', places: ['Main Market'] },
    ],
    rentals: [{ type: 'Scooter Rental', cost: '₹500' }],
    nearbyDestinations: [],
    travelTips: ['Carry a water bottle', 'Respect local customs'],
    packingGuide: ['Comfortable shoes', 'Power bank'],
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
You are a professional travel guide API for Indian destinations.
Generate a factually accurate travel guide for "${destination}".

STRICT RULES:
- All places, activities, hotels MUST be real and specific to "${destination}"
- imageQuery must include the destination name + item name (e.g. "Rohtang Pass Manali snow road")
- Activities: include realistic Indian prices (₹)
- Hotels: include realistic prices per night (₹) and a rating (4.0–4.9)
- Itinerary: 3–4 days covering the popular places
- Exactly 6 popularPlaces, 4–6 activities, 4 hotels
- travelTips and packingGuide must be specific to "${destination}"'s climate and culture
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
