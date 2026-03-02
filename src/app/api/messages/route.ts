import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, role, content } = await req.json();

    if (!chatId || !role || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (role !== "user" && role !== "assistant") {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findOne({ _id: chatId, userId: (session.user as any).id }).lean();
    if (!chat) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    const newMessage = await Message.create({
      chatId,
      role,
      content,
    });

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 });
    }

    await connectDB();

    const chat = await Chat.findOne({ _id: chatId, userId: (session.user as any).id }).lean();
    if (!chat) {
      return NextResponse.json({ error: "Chat not found or unauthorized" }, { status: 404 });
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 }).lean();

    return NextResponse.json(messages, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
