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

  if (cached && cached.data && Object.keys(cached.data).length > 0) {
    console.log('✅ Found cached guide for:', destination);
    return cached.data;
  }

  try {
    console.log('🤖 Calling Genkit for:', destination);
    const { output } = await ai.generate({
      prompt: `Act as a professional travel guide. Generate a comprehensive travel guide for "${destination}".
      Ensure the altitude is accurate, best time to visit is specific, and popular places are iconic.
      Tips should be practical and packing items should be seasonal.`,
      output: {
        schema: DestinationGuideSchema
      }
    });

    if (!output) {
      console.error("❌ Genkit returned empty output for:", destination);
      throw new Error("No output from AI");
    }

    // Save to Cache
    try {
      await connectDB();
      await DestinationGuide.findOneAndUpdate(
        { destination: destination.toLowerCase() },
        { 
          destination: destination.toLowerCase(),
          data: output,
          updatedAt: new Date()
        },
        { upsert: true }
      );
    } catch (saveErr) {
      console.warn("⚠️ Cache save failed:", saveErr);
    }

    return output;
  } catch (error) {
    console.error("❌ Comprehensive Guide Generation Error:", error);
    
    // FALLBACK GUIDE: Returns a functional guide if AI fails, ensuring the page "opens"
    return {
      destination: destination,
      hero: {
        title: `Explore ${destination}`,
        description: `Uncover the hidden gems and breathtaking landscapes of ${destination}. Plan your journey today.`
      },
      quickFacts: {
        altitude: "Varies",
        bestTime: "October to March",
        avgTemp: "20°C",
        location: "India"
      },
      popularPlaces: [
        { name: "Main Market", description: "The heart of the city with dozens of local shops.", image_query: `${destination} market` },
        { name: "City Park", description: "A peaceful green space perfect for evening walks.", image_query: `${destination} park` }
      ],
      activities: [
        { name: "City Walking Tour", location: "Downtown", bestSeason: "Any", cost: "Free" }
      ],
      hotels: [
        { name: `${destination} Grand Hotel`, type: "Luxury" }
      ],
      rentals: [
        { type: "Scooter Rental", cost: "₹500/day" }
      ],
      nearbyDestinations: [],
      travelTips: ["Carry a water bottle", "Respect local customs"],
      packingGuide: ["Comfortable shoes", "Power bank"]
    };
  }
}
