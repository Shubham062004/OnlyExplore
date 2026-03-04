import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { name, emailOrPhone, password } = await req.json();

    if (!emailOrPhone || !password) {
      return NextResponse.json({ error: "Email/Phone and password are required" }, { status: 400 });
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
