'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { connectDB } from '@/lib/mongodb';
import DestinationGuide from '@/models/DestinationGuide';

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
    description: z.string(),
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
  try {
    await connectDB();

    const cached = await DestinationGuide.findOne({
      destination: { $regex: new RegExp('^' + destination + '$', 'i') }
    });

    if (cached) {
      console.log('Returning CACHED destination guide for:', destination);
      return cached.data;
    }

    console.log('GENERATING new destination guide for:', destination);
    const { output } = await ai.generate({
      prompt: `Generate a comprehensive travel destination guide for "${destination}".
Return structured JSON matching the provided schema exactly.
Do not use any $ref references.
Return:
- hero (title and short engaging description)
- quickFacts (altitude, bestTime, avgTemp, location)
- popularPlaces (up to 4 places, name and short description)
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
      try {
        await DestinationGuide.findOneAndUpdate(
          { destination: destination.toLowerCase() },
          { data: output },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (cacheError) {
        console.warn("Could not cache destination guide:", cacheError);
      }

      return output;
    }
    
    return null;
  } catch (error) {
    console.error("Failed to generate destination guide:", error);
    return null;
  }
}
