import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password || password.length < 6) {
      return NextResponse.json({ success: false, error: "Invalid token or password too short" }, { status: 400 });
    }

    await connectDB();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Token is invalid or has expired" }, { status: 400 });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info(`Password successfully reset for ${user.email}`);

    return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
  } catch (error: any) {
    logger.error("Error resetting password", { error: error.message });
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
