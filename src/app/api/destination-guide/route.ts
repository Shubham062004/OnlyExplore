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
 * 3. Dynamic Unsplash URLs
 * 4. STRICT JSON adherence
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location')?.toLowerCase();

  if (!location) {
    return NextResponse.json({ error: "Location is required" }, { status: 400 });
  }

  try {
    await connectDB();

    // 🏆 STEP 1: Check Cache (VERY IMPORTANT)
    const cached = await DestinationGuide.findOne({ destination: location });
    if (cached && cached.data && cached.images?.hero) {
      console.log('✅ Returning cached guide for:', location);
      return NextResponse.json({
        location: cached.destination,
        heroImage: cached.images.hero,
        places: cached.data.places.map((p: any, idx: number) => ({
          ...p,
          image: cached.images.places[idx]
        }))
      });
    }

    console.log('🤖 Generating NEW guide for:', location);

    // 🧠 STEP 1: Gemini generates structured data for images
    const Schema = z.object({
      hero_query: z.string(),
      places: z.array(z.object({
        name: z.string(),
        description: z.string(),
        image_query: z.string()
      }))
    });

    const { output } = await ai.generate({
      prompt: `
        Generate travel data for: ${location}
        
        Return STRICT JSON:
        {
          "hero_query": "most iconic landmark of ${location}",
          "places": [
            {
              "name": "famous site name",
              "description": "brief description",
              "image_query": "optimized unsplash search query"
            }
          ]
        }
        
        RULES:
        - Return ONLY JSON
        - Max 8 places
        - image_query must be optimized for Unsplash search (e.g. "Paris Eiffel Tower night")
        - description max 15 words
      `,
      output: { schema: Schema }
    });

    if (!output) throw new Error("Gemini failed to generate guide data.");

    // 🖼️ STEP 2: Fetch REAL images using Unsplash pattern
    const heroImage = `https://source.unsplash.com/1600x900/?${encodeURIComponent(output.hero_query)}`;
    
    const placesWithImages = output.places.map(p => ({
      name: p.name,
      description: p.description,
      image: `https://source.unsplash.com/800x600/?${encodeURIComponent(p.image_query)}`
    }));

    // 📦 STEP 3: Save to MongoDB
    await DestinationGuide.findOneAndUpdate(
      { destination: location },
      {
        destination: location,
        data: { places: output.places }, // Save raw data
        images: {
          hero: heroImage,
          places: placesWithImages.map(p => p.image)
        },
        createdAt: new Date()
      },
      { upsert: true }
    );

    // 🚀 FINAL RESPONSE
    return NextResponse.json({
      location: location,
      heroImage: heroImage,
      places: placesWithImages
    });

  } catch (error: any) {
    console.error("❌ Destination Guide API Error:", error);
    
    // Fallback if Unsplash or Gemini fails
    return NextResponse.json({
      location: location,
      heroImage: `https://source.unsplash.com/1600x900/?travel,${location}`,
      places: [
        {
          name: "Explore",
          description: "Discover the hidden gems of this destination.",
          image: `https://source.unsplash.com/800x600/?landmark,${location}`
        }
      ]
    });
  }
}
