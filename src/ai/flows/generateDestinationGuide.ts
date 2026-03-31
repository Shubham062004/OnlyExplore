'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { connectDB } from '@/lib/mongodb';
import DestinationGuide from '@/models/DestinationGuide';
import { fetchDestinationImages } from '@/lib/images';

const DestinationGuideSchema = z.object({
  destination: z.string(),
  hero: z.object({
    title: z.string(),
    description: z.string()
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
    image_query: z.string().describe('optimized for Unsplash search, e.g. "Paris Eiffel Tower night"')
  })),
  activities: z.array(z.object({
    name: z.string(),
    location: z.string().optional(),
    bestSeason: z.string().optional(),
    cost: z.string().optional(),
  })),
  hotels: z.array(z.object({
    name: z.string(),
    type: z.string(), 
  })),
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

export async function generateDestinationGuide(destination: string) {
  let cached = null;
  try {
    await connectDB();
    cached = await DestinationGuide.findOne({
      destination: { $regex: new RegExp('^' + destination + '$', 'i') }
    });
  } catch (dbError) {
    console.warn("MongoDB connection or read failed, skipping cache:", dbError);
  }

  if (cached && cached.data) {
    console.log('Returning CACHED destination guide for:', destination);
    // Return combined data with images
    return { 
      ...cached.data, 
      images: cached.images || (await fetchDestinationImages(destination)) 
    };
  }

  try {
    console.log('GENERATING new destination guide for:', destination);
    const { output } = await ai.generate({
      prompt: `Generate a comprehensive travel destination guide for "${destination}".
Return structured JSON matching the provided schema exactly.
Do not use any $ref references.
Return:
- hero (title and short engaging description)
- quickFacts (altitude, bestTime, avgTemp, location)
- popularPlaces (up to 4 places):
  - name: iconic landmark name
  - description: short description (MAX 15 words)
  - image_query: optimized for Unsplash search
- activities (up to 4 adventure or local activities with location, bestSeason, cost string like "₹500-₹1000")
- hotels (3 hotels: Luxury, Mid-range, Budget)
- rentals (e.g. Bike rental, Scooter rental, Car rental with estimated cost)
- nearbyDestinations (names and distances)
- travelTips (4 essential tips)
- packingGuide (4 items)`,
      output: {
        schema: DestinationGuideSchema
      }
    });

    if (output) {
      // ✨ STEP 2: Fetch REAL images using Unsplash pattern
      const heroQuery = output.hero?.title || destination;
      const images = {
        hero: `https://source.unsplash.com/1600x900/?${encodeURIComponent(heroQuery)}`,
        places: output.popularPlaces.map(p => `https://source.unsplash.com/800x600/?${encodeURIComponent(p.image_query || p.name)}`),
        // Fallback for others if needed
        activities: output.activities?.map(a => `https://source.unsplash.com/800x600/?${encodeURIComponent(a.name)}`),
        hotels: output.hotels?.map(h => `https://source.unsplash.com/800x600/?${encodeURIComponent(h.name)}`),
      };

      const combinedOutput = { ...output, images };

      try {
        await connectDB();
        await DestinationGuide.findOneAndUpdate(
          { destination: destination.toLowerCase() },
          { 
            data: output,
            images: images 
          },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );
      } catch (cacheError) {
        console.warn("Could not cache destination guide:", cacheError);
      }

      return combinedOutput;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to generate destination guide:", error);
    return null;
  }
}
