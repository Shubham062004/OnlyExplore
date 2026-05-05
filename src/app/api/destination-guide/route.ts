import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { connectDB } from '@/lib/mongodb';
import DestinationGuide from '@/models/DestinationGuide';

/**
 * ⚡ DESTINATION GUIDE API 2.0
 *
 * Features:
 * 1. MongoDB Caching (Check before Gemini)
 * 2. 2-Step Gemini Image System
 * 3. Real Unsplash API (source.unsplash.com is deprecated)
 * 4. Per-place unique images
 */

const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600&auto=format&fit=crop';
const FALLBACK_PLACE =
  'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?q=80&w=800&auto=format&fit=crop';

async function fetchUnsplashImage(query: string, accessKey: string): Promise<string> {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
      query
    )}&per_page=1&orientation=landscape&client_id=${accessKey}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return '';
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || '';
  } catch {
    return '';
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawLocation = searchParams.get('location');

  if (!rawLocation) {
    return NextResponse.json({ error: 'Location is required' }, { status: 400 });
  }

  const location = rawLocation.toLowerCase().trim();
  console.log('LOCATION:', location);

  try {
    await connectDB();

    // 🏆 STEP 1: Check Cache — keyed by lowercase trimmed destination
    const cached = await DestinationGuide.findOne({ destination: location });
    console.log('CACHE HIT:', !!cached);

    if (cached && cached.data && cached.images?.hero) {
      console.log('✅ Returning cached guide for:', location);
      return NextResponse.json({
        location: cached.destination,
        heroImage: cached.images.hero,
        places: (cached.data.places || []).map((p: any, idx: number) => ({
          ...p,
          image: cached.images.places?.[idx] || FALLBACK_PLACE,
        })),
      });
    }

    console.log('🤖 Generating NEW guide for:', location);

    // 🧠 STEP 2: Gemini generates structured place data
    const Schema = z.object({
      hero_query: z.string(),
      places: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          image_query: z.string(),
        })
      ),
    });

    const { output } = await ai.generate({
      prompt: `
You are a travel API. Return ONLY valid JSON — no markdown, no explanation.

For the location: "${location}"

Give exactly 6 unique famous places that are SPECIFIC to ${location}.
Each place MUST actually exist in or near ${location}.

Return this exact JSON structure:
{
  "hero_query": "most iconic landmark or landscape of ${location}",
  "places": [
    {
      "name": "Famous Place Name",
      "description": "Brief description in max 15 words",
      "image_query": "${location} Famous Place Name landmark"
    }
  ]
}

RULES:
- Return ONLY JSON, no code blocks
- Exactly 6 places
- image_query must include the location name and place name for accurate Unsplash results
- All places must be real and specific to ${location}
      `,
      output: { schema: Schema },
    });

    console.log('PARSED:', JSON.stringify(output));

    if (!output) throw new Error('Gemini failed to generate guide data.');

    const ACCESS_KEY =
      process.env.UNSPLASH_ACCESS_KEY ||
      process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY ||
      '';

    // 🖼️ STEP 3: Fetch REAL images from Unsplash search API
    let heroImage = FALLBACK_HERO;
    if (ACCESS_KEY) {
      const fetched = await fetchUnsplashImage(output.hero_query, ACCESS_KEY);
      if (fetched) heroImage = fetched;
    }

    const placesWithImages = await Promise.all(
      output.places.map(async (p) => {
        let image = FALLBACK_PLACE;
        if (ACCESS_KEY) {
          const fetched = await fetchUnsplashImage(p.image_query, ACCESS_KEY);
          if (fetched) image = fetched;
        }
        return { name: p.name, description: p.description, image };
      })
    );

    // 📦 STEP 4: Save to MongoDB with consistent lowercase key
    await DestinationGuide.findOneAndUpdate(
      { destination: location },
      {
        destination: location,
        data: { places: output.places },
        images: {
          hero: heroImage,
          places: placesWithImages.map((p) => p.image),
        },
        createdAt: new Date(),
      },
      { upsert: true }
    );

    // 🚀 FINAL RESPONSE
    return NextResponse.json({ location, heroImage, places: placesWithImages });
  } catch (error: any) {
    console.error('❌ Destination Guide API Error:', error);

    // Graceful fallback — never break the UI
    return NextResponse.json({
      location,
      heroImage: FALLBACK_HERO,
      places: [
        {
          name: `Explore ${rawLocation}`,
          description: 'Discover the hidden gems of this destination.',
          image: FALLBACK_PLACE,
        },
      ],
    });
  }
}
