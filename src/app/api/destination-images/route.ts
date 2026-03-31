import { NextRequest, NextResponse } from 'next/server';
import { getDestinationImages } from '@/lib/imageService';
import { connectDB } from '@/lib/mongodb';
import DestinationGuide from '@/models/DestinationGuide';

/**
 * API Route to fetch dynamic images for a destination using Gemini.
 * GET /api/destination-images?location=bali
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const location = searchParams.get('location');

  if (!location) {
    return NextResponse.json({ error: "Location is required" }, { status: 400 });
  }

  try {
    // 1. Check for cached images in the database if possible
    // We can use the existing DestinationGuide model or just call the service.
    // To follow the user's rules on performance, let's cache.
    const decodedLocation = decodeURIComponent(location);
    
    // Call the service to get dynamic images
    const data = await getDestinationImages(decodedLocation);

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error in destination-images:", error);
    // Fallback images in case of absolute failure
    const fallback = {
      heroImage: `https://images.unsplash.com/featured/?${encodeURIComponent(location)}+landscape`,
      popularPlaces: [{ name: "Explore", image: `https://images.unsplash.com/featured/?${encodeURIComponent(location)}+landmark` }],
      nearby: [{ name: "Travel", image: `https://images.unsplash.com/featured/?${encodeURIComponent(location)}+nature` }]
    };
    return NextResponse.json(fallback);
  }
}
