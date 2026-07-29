import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Favorite from "@/models/Favorite";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * ⚡ FAVORITES & BOOKMARKS API (`/api/favorites`)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId");
    const itemType = searchParams.get("itemType");

    const query: any = {};
    if (session?.user) {
      query.userId = (session.user as any).id;
    } else if (guestId) {
      query.guestId = guestId;
    } else {
      query.guestId = "guest_default_session";
    }

    if (itemType) {
      query.itemType = itemType;
    }

    const favorites = await Favorite.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      total: favorites.length,
      data: favorites,
    });
  } catch (error: any) {
    console.error("❌ GET /api/favorites Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const body = await req.json();

    const { itemType, itemId, name, destination, metadata, guestId } = body;

    if (!itemType || !itemId || !name || !destination) {
      return NextResponse.json(
        { success: false, error: "itemType, itemId, name, and destination are required" },
        { status: 400 }
      );
    }

    const filter: any = { itemId };
    if (session?.user) {
      filter.userId = (session.user as any).id;
    } else {
      filter.guestId = guestId || "guest_default_session";
    }

    const favorite = await Favorite.findOneAndUpdate(
      filter,
      {
        userId: session?.user ? (session.user as any).id : undefined,
        guestId: !session?.user ? guestId || "guest_default_session" : undefined,
        itemType,
        itemId,
        name,
        destination,
        metadata: metadata || {},
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      success: true,
      message: "Added to favorites",
      data: favorite,
    });
  } catch (error: any) {
    console.error("❌ POST /api/favorites Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const id = searchParams.get("id");

    if (id) {
      await Favorite.findByIdAndDelete(id);
    } else if (itemId) {
      await Favorite.deleteMany({ itemId });
    } else {
      return NextResponse.json({ success: false, error: "id or itemId required" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Removed from favorites" });
  } catch (error: any) {
    console.error("❌ DELETE /api/favorites Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
