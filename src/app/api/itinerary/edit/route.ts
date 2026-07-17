import { NextRequest, NextResponse } from "next/server";
import { AiService } from "@/services/ai.service";

/**
 * ⚡ EDIT ITINERARY API (Server Proxy)
 * Safely runs the Genkit itinerary editor flow on the server via AiService,
 * keeping browser code clean and isolated.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await AiService.editItinerary(body);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("❌ Edit Itinerary API Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Failed to edit itinerary" 
    }, { status: 500 });
  }
}
