import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json({ error: "No token provided" }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return NextResponse.json({ error: "Token is invalid or has expired." }, { status: 400 });
        }

        user.emailVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        logger.info("Email verified successfully", { userId: user._id });

        // Redirect back to main page or a success page
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/?verified=true`);

    } catch (error) {
        logger.error("Email verification failed", { error: (error as any).message });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
