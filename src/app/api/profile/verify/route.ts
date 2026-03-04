import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type, identifier, action, otp } = await req.json();

    if (!identifier || (type !== "email" && type !== "phone")) {
      return NextResponse.json({ error: "Valid type and identifier are required" }, { status: 400 });
    }

    await connectDB();
    const userId = (session.user as any).id;
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (action === "send") {
      // Check if identifier is already taken by ANOTHER user
      const existing = await User.findOne({ [type]: identifier, _id: { $ne: userId } });
      if (existing && existing[type + "Verified"]) {
        return NextResponse.json({ error: `This ${type} is already registered by another verified user.` }, { status: 400 });
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(generatedOtp, 10);
      const expires = new Date(Date.now() + 5 * 60 * 1000);

      if (type === "email") {
        user.emailOtp = hashedOtp;
        user.emailOtpExpires = expires;
        logger.info(`Sending Email OTP code ${generatedOtp} to ${identifier}`);
      } else {
        user.phoneOtp = hashedOtp;
        user.phoneOtpExpires = expires;
        logger.info(`Sending Phone OTP code ${generatedOtp} to ${identifier}`);
      }
      
      await user.save();
      return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });

    } else if (action === "verify") {
      if (!otp) {
        return NextResponse.json({ error: "OTP is required" }, { status: 400 });
      }

      if (type === "email") {
        if (!user.emailOtp || !user.emailOtpExpires || user.emailOtpExpires < new Date() || !(await bcrypt.compare(otp, user.emailOtp))) {
          return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }
        user.email = identifier;
        user.emailVerified = true;
        user.emailOtp = undefined;
        user.emailOtpExpires = undefined;
      } else {
        if (!user.phoneOtp || !user.phoneOtpExpires || user.phoneOtpExpires < new Date() || !(await bcrypt.compare(otp, user.phoneOtp))) {
          return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }
        user.phone = identifier;
        user.phoneVerified = true;
        user.phoneOtp = undefined;
        user.phoneOtpExpires = undefined;
      }

      await user.save();
      return NextResponse.json({ message: `${type} verified successfully!` }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    logger.error("Error in profile verification", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
