import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/Trip";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * ⚡ TRIPS COLLECTION API
 * Handles GET (fetch user's trips by status: Upcoming, Completed, Saved, Draft)
 * and POST (create trip with auto-save).
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const guestId = searchParams.get("guestId");

    const query: any = { isArchived: false };

    if (session?.user) {
      query.userId = (session.user as any).id;
    } else if (guestId) {
      query.guestId = guestId;
    } else {
      // Fallback guest identifier if unauthenticated
      query.guestId = "guest_default_session";
    }

    if (status && status !== "All") {
      query.status = status;
    }

    const trips = await Trip.find(query).sort({ updatedAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      total: trips.length,
      data: trips,
    });
  } catch (error: any) {
    console.error("❌ GET /api/trips Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch trips" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const { destination, title, status, budget, itinerary, hotels, attractions, guestId } = body;

    if (!destination) {
      return NextResponse.json({ success: false, error: "Destination is required" }, { status: 400 });
    }

    const shareKey = `trip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const newTrip = await Trip.create({
      userId: session?.user ? (session.user as any).id : undefined,
      guestId: !session?.user ? guestId || "guest_default_session" : undefined,
      destination,
      title: title || `Trip to ${destination}`,
      status: status || "Draft",
      budget: budget || { total: 10000, currency: "INR" },
      itinerary: itinerary || [],
      hotels: hotels || [],
      attractions: attractions || [],
      shareKey,
    });

    const elapsedMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Trip created successfully",
      elapsedMs,
      data: newTrip,
    });
  } catch (error: any) {
    console.error("❌ POST /api/trips Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create trip" },
      { status: 500 }
    );
  }
}
