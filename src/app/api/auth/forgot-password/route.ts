import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }


    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal user existence, just return success
      return NextResponse.json({ message: "If an account with that email exists, we sent a reset link." }, { status: 200 });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token for saving to DB (SHA256, so we can search it later easily)
    const passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    const passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.passwordResetToken = passwordResetToken;
    user.passwordResetExpires = passwordResetExpires;
    await user.save();

    // The reset URL that would be emailed
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    
    // Placeholder email
    logger.info(`Sending password reset link to ${user.email}: ${resetUrl}`);

    return NextResponse.json({ message: "If an account with that email exists, we sent a reset link." }, { status: 200 });
  } catch (error: any) {
    logger.error("Error creating forgot password token", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
