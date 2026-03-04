import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import { metrics } from "@/lib/metrics";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      metrics.trackApiDuration("/api/chats (POST)", Date.now() - startTime);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await req.json();

    if (!title) {
      metrics.trackApiDuration("/api/chats (POST)", Date.now() - startTime);
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    await connectDB();

    const newChat = await Chat.create({
      userId: (session.user as any).id,
      title,
    });

    metrics.trackApiDuration("/api/chats (POST)", Date.now() - startTime);
    return NextResponse.json(newChat, { status: 201 });
  } catch (error: any) {
    logger.error("Error in /api/chats POST", { error: error.message });
    metrics.trackApiDuration("/api/chats (POST)", Date.now() - startTime);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      metrics.trackApiDuration("/api/chats (GET)", Date.now() - startTime);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const chats = await Chat.find({ userId: (session.user as any).id }).sort({ updatedAt: -1 }).lean();

    metrics.trackApiDuration("/api/chats (GET)", Date.now() - startTime);
    return NextResponse.json(chats, { status: 200 });
  } catch (error: any) {
    logger.error("Error in /api/chats GET", { error: error.message });
    metrics.trackApiDuration("/api/chats (GET)", Date.now() - startTime);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
