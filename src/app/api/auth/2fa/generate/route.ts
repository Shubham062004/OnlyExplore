import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { authenticator } from "otplib";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.twoFactorEnabled) {
            return NextResponse.json({ error: "2FA is already enabled" }, { status: 400 });
        }

        const secret = authenticator.generateSecret();
        const otpauthURL = authenticator.keyuri(
            user.email,
            "OnlyExplore SaaS",
            secret
        );
        
        // Save the temp secret in user record
        // We will finalize it in the verify step
        user.twoFactorSecret = secret;
        await user.save();

        return NextResponse.json({
            secret,
            otpauthURL,
        });
    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
