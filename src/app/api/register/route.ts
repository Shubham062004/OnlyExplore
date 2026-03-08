import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { logger } from "@/lib/logger";
import { applyRateLimit } from "@/lib/rateLimit";
import { verifyCaptcha } from "@/lib/captcha";

export async function POST(req: Request) {
  try {
    const { name, emailOrPhone, password, captchaToken } = await req.json();

    if (!emailOrPhone || !password || !captchaToken) {
      return NextResponse.json({ success: false, error: "Email/Phone, password and captcha are required" }, { status: 400 });
    }

    const isValidCaptcha = await verifyCaptcha(captchaToken);
    if (!isValidCaptcha) {
      return NextResponse.json({ success: false, error: "Invalid CAPTCHA" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown_ip";
    const rateLimit = applyRateLimit(ip);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
    }

    await connectDB();

    const isEmail = emailOrPhone.includes("@");
    const query = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };

    const existingUser = await User.findOne(query).lean();
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with that identifier." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUserData: any = {
      name,
      password: hashedPassword,
    };

    if (isEmail) {
       newUserData.email = emailOrPhone;
       newUserData.emailVerified = false;
    } else {
       newUserData.phone = emailOrPhone;
       newUserData.phoneVerified = false;
    }

    const newUser = await User.create(newUserData);

    return NextResponse.json(
      { message: `User created successfully.`, userId: newUser._id },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Signup failed", { error: (error as any).message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
