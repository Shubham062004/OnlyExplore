import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Trip from "@/models/Trip";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * ⚡ SINGLE TRIP & AUTO-SAVE API (`/api/trips/[id]`)
 * Fast response (<300ms) for auto-saving trip modifications.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    // Check if ID is MongoDB ObjectId or Share Key
    let trip = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      trip = await Trip.findById(id).lean();
    } else {
      trip = await Trip.findOne({ shareKey: id }).lean();
    }

    if (!trip) {
      return NextResponse.json({ success: false, error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: trip });
  } catch (error: any) {
    console.error("❌ GET /api/trips/[id] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  try {
    await connectDB();
    const { id } = await params;
    const updates = await req.json();

    // Fast auto-save update
    const updatedTrip = await Trip.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedTrip) {
      return NextResponse.json({ success: false, error: "Trip not found for auto-save" }, { status: 404 });
    }

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: "Auto-saved successfully",
      responseTimeMs,
      data: updatedTrip,
    });
  } catch (error: any) {
    console.error("❌ PUT /api/trips/[id] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const archive = searchParams.get("archive") === "true";

    if (archive) {
      await Trip.findByIdAndUpdate(id, { isArchived: true });
      return NextResponse.json({ success: true, message: "Trip archived successfully" });
    }

    await Trip.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Trip deleted successfully" });
  } catch (error: any) {
    console.error("❌ DELETE /api/trips/[id] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
