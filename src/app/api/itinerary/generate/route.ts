import { NextRequest, NextResponse } from "next/server";
import { AiService } from "@/services/ai.service";

/**
 * ⚡ GENERATE ITINERARY API (Server Proxy)
 * Safely runs the Genkit itinerary generation flow on the server via AiService,
 * completely isolating Genkit/Node dependencies from the browser bundle.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await AiService.generateItinerary(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ Generate Itinerary API Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to generate itinerary" 
    }, { status: 500 });
  }
}
