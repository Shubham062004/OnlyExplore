import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/ai/genkit";
import { z } from "genkit";

const ChatResponseSchema = z.object({
  text: z.string().optional(),
  places: z.array(z.object({
    type: z.literal("place"),
    name: z.string(),
    description: z.string(),
    rating: z.number().optional(),
    tag: z.string().optional(),
    location: z.string().optional(),
    bestTime: z.string().optional(),
    weather: z.string().optional(),
    activities: z.array(z.string()).optional(),
    imageQuery: z.string()
  })).optional(),
  hotel: z.object({
    type: z.literal("hotel"),
    name: z.string(),
    description: z.string(),
    price: z.string(),
    rating: z.number().optional(),
    tag: z.string().optional(),
    location: z.string().optional(),
    bestTime: z.string().optional(),
    weather: z.string().optional(),
    activities: z.array(z.string()).optional(),
    imageQuery: z.string()
  }).optional()
});

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop";

async function fetchUnsplashImage(query: string): Promise<string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || '';
  if (!accessKey) return FALLBACK_IMAGE;

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${accessKey}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return FALLBACK_IMAGE;
    const data = await res.json();
    return data.results?.[0]?.urls?.regular || FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();
    const groupSizeText = lowerMessage.includes("friends") && !/\d/.test(lowerMessage) 
      ? "Assume a group size of 4 since friends were mentioned without a specific number." 
      : "";

    const { output } = await ai.generate({
      prompt: `
        You are LuxeTravel AI, an expert travel planner. 
        User query: "${message}"
        ${groupSizeText}
        
        Generate a structured itinerary-based response including:
        - A day-wise plan
        - Activities
        - Budget suggestions
        - Hotels
        - Travel tips

        In the 'text' field, provide the detailed day-wise itinerary, budget breakdown, and travel tips formatted nicely with line breaks.
        In the 'places' array, include the specific locations to visit.
        In the 'hotel' object, include a recommended stay.
        
        Keep descriptions concise and engaging.
        Include location (e.g. "North Goa, India"), bestTime (e.g. "Oct-Mar"), weather (e.g. "28°C Sunny"), and an array of activities for each item.
        Ratings should be between 4.0 and 5.0.
        Tags can be like "Iconic", "Heritage", "Nature", "Adventure", "Luxury Stay".
        For "imageQuery", provide specific keywords like "Lakshman Jhula Rishikesh bridge".
      `,
      output: { schema: ChatResponseSchema }
    });

    if (!output) {
      throw new Error("No output generated");
    }

    // Enrich with Unsplash images
    let enrichedPlaces: any[] = [];
    if (output.places && output.places.length > 0) {
      enrichedPlaces = await Promise.all(
        output.places.map(async (p) => {
          const image = await fetchUnsplashImage(p.imageQuery);
          return { ...p, image };
        })
      );
    }

    let enrichedHotel = undefined;
    if (output.hotel) {
      const image = await fetchUnsplashImage(output.hotel.imageQuery);
      enrichedHotel = { ...output.hotel, image };
    }

    return NextResponse.json({
      text: output.text,
      places: enrichedPlaces.length > 0 ? enrichedPlaces : undefined,
      hotel: enrichedHotel
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
  }
}
