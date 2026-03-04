import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    await connectDB();

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const user = await User.findOne({ email });
    if (!user) {
      await User.create({ email, emailOtp: hashedOtp, emailOtpExpires: expires });
    } else {
      await User.updateOne(
        { _id: user._id },
        { emailOtp: hashedOtp, emailOtpExpires: expires }
      );
    }

    // Placeholder for sending email
    logger.info(`Sending Email OTP code ${otp} to ${email}`);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error: any) {
    logger.error("Error sending email OTP", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
