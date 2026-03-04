import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.length < 5) {
      return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
    }

    await connectDB();

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    let user = await User.findOne({ phone });
    if (!user) {
      // Create user with placeholder email since email is required
      const tempEmail = `phone_${phone}@placeholder.onlyexplore.com`;
      user = await User.create({ email: tempEmail, phone, phoneOtp: hashedOtp, phoneOtpExpires: expires });
    } else {
      await User.updateOne(
        { _id: user._id },
        { phoneOtp: hashedOtp, phoneOtpExpires: expires }
      );
    }

    // Placeholder for sending SMS
    logger.info(`Sending SMS OTP code ${otp} to ${phone}`);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error: any) {
    logger.error("Error sending phone OTP", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
