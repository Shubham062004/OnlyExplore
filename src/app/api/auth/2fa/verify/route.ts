import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { authenticator } from "otplib";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: "Verification code is required" }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email });

        if (!user || (!user.twoFactorSecret)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const isValid = authenticator.check(code, user.twoFactorSecret);

        if (!isValid) {
            return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
        }

        user.twoFactorEnabled = true;
        await user.save();

        logger.info("2FA Enabled", { userId: user._id });

        return NextResponse.json({ success: true, message: "2FA successfully enabled." });
    } catch (error: any) {
        logger.error("2FA Verify Error", { error: error.message });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
