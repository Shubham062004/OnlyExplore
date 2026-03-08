import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import { metrics } from "@/lib/metrics";
import { logger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rateLimit";

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      metrics.trackApiDuration("/api/messages (POST)", Date.now() - startTime);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown_ip";
    const rateLimit = applyRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json({ success: false, error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const { chatId, role, content } = await req.json();

    if (!chatId || !role || !content) {
      metrics.trackApiDuration("/api/messages (POST)", Date.now() - startTime);
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (role !== "user" && role !== "assistant") {
      metrics.trackApiDuration("/api/messages (POST)", Date.now() - startTime);
      return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findOne({ _id: chatId, userId: (session.user as any).id }).lean();
    if (!chat) {
      metrics.trackApiDuration("/api/messages (POST)", Date.now() - startTime);
      return NextResponse.json({ success: false, error: "Chat not found or unauthorized" }, { status: 404 });
    }

    const newMessage = await Message.create({
      chatId,
      role,
      content,
    });

    metrics.trackApiDuration("/api/messages (POST)", Date.now() - startTime);
    return NextResponse.json(newMessage, { status: 201 });
  } catch (error: any) {
    logger.error("Error in /api/messages POST", { error: error.message });
    metrics.trackApiDuration("/api/messages (POST)", Date.now() - startTime);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      metrics.trackApiDuration("/api/messages (GET)", Date.now() - startTime);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      metrics.trackApiDuration("/api/messages (GET)", Date.now() - startTime);
      return NextResponse.json({ success: false, error: "chatId is required" }, { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findOne({ _id: chatId, userId: (session.user as any).id }).lean();
    if (!chat) {
      metrics.trackApiDuration("/api/messages (GET)", Date.now() - startTime);
      return NextResponse.json({ success: false, error: "Chat not found or unauthorized" }, { status: 404 });
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();

    metrics.trackApiDuration("/api/messages (GET)", Date.now() - startTime);
    return NextResponse.json(messages, { status: 200 });
  } catch (error: any) {
    logger.error("Error in /api/messages GET", { error: error.message });
    metrics.trackApiDuration("/api/messages (GET)", Date.now() - startTime);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
