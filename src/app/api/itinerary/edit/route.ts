import { NextRequest, NextResponse } from "next/server";
import { AiService } from "@/services/ai.service";

/**
 * ⚡ EDIT ITINERARY API (Server Proxy)
 * Stage-by-stage fault-tolerant AI edit handler.
 */
function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  return cleaned;
}

export async function POST(req: NextRequest) {
  let stage = "Request Received";

  try {
    // Stage 1: Request received & body extraction
    stage = "Request Body Extraction";
    console.log(`[Edit API] Stage: ${stage}`);
    const body = await req.json();

    // Stage 2: Payload Validation
    stage = "Payload Validation";
    console.log(`[Edit API] Stage: ${stage}`);
    
    const rawItinerary = body.itinerary || body.currentItinerary;
    const editRequest = body.editRequest;

    if (!rawItinerary) {
      return NextResponse.json({
        success: false,
        stage: "Payload Validation",
        error: "Missing required field: 'itinerary' or 'currentItinerary'",
        file: "src/app/api/itinerary/edit/route.ts",
        line: 30,
      }, { status: 400 });
    }

    if (!editRequest || typeof editRequest !== "string" || !editRequest.trim()) {
      return NextResponse.json({
        success: false,
        stage: "Payload Validation",
        error: "Missing or invalid required field: 'editRequest'",
        file: "src/app/api/itinerary/edit/route.ts",
        line: 40,
      }, { status: 400 });
    }

    // Stage 3: Normalize Itinerary to String
    stage = "Itinerary String Normalization";
    console.log(`[Edit API] Stage: ${stage}`);
    const itineraryString = typeof rawItinerary === "object" 
      ? JSON.stringify(rawItinerary) 
      : String(rawItinerary);

    // Stage 4: AI Service Generation
    stage = "AI Service Execution";
    console.log(`[Edit API] Stage: ${stage}`);
    const aiOutput = await AiService.editItinerary({
      itinerary: itineraryString,
      editRequest: editRequest.trim(),
    });

    // Stage 5: Response Parsing & JSON Cleaning
    stage = "AI Response Parsing";
    console.log(`[Edit API] Stage: ${stage}`);
    
    let parsedData: any = null;
    if (aiOutput && typeof aiOutput === "object" && (aiOutput as any).updatedItinerary) {
      const rawOutputStr = (aiOutput as any).updatedItinerary;
      if (typeof rawOutputStr === "object") {
        parsedData = rawOutputStr;
      } else {
        try {
          const cleanedStr = cleanJsonString(rawOutputStr);
          parsedData = JSON.parse(cleanedStr);
        } catch (jsonErr: any) {
          console.error("❌ JSON Parse Error in Edit API:", jsonErr);
          return NextResponse.json({
            success: false,
            stage: "AI Response Parsing",
            error: `Failed to parse AI output: ${jsonErr.message}`,
            file: "src/app/api/itinerary/edit/route.ts",
            line: 75,
            rawOutputSample: String(rawOutputStr).substring(0, 200),
          }, { status: 422 });
        }
      }
    } else {
      parsedData = aiOutput;
    }

    // Stage 6: Success Serialization
    stage = "Response Serialization";
    console.log(`[Edit API] Stage: ${stage} - Success!`);
    return NextResponse.json({
      success: true,
      stage: "Success",
      data: parsedData,
    }, { status: 200 });

  } catch (error: any) {
    console.error(`❌ Edit Itinerary API Error at Stage [${stage}]:`, error);
    return NextResponse.json({
      success: false,
      stage,
      error: error.message || "An unexpected internal server error occurred.",
      file: "src/app/api/itinerary/edit/route.ts",
      stack: error.stack ? error.stack.split("\n").slice(0, 3).join("\n") : undefined,
    }, { status: 500 });
  }
}
