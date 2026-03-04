import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, image, currentPassword, newPassword, twoFactorEnabled, twoFactorMethods } = body;

        await mongoose.connect(process.env.MONGODB_URI as string);
        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let updates: any = {};
        
        if (name !== undefined && name !== user.name) updates.name = name;
        if (image !== undefined && image !== user.image) updates.image = image;
        
        if (twoFactorEnabled !== undefined) updates.twoFactorEnabled = twoFactorEnabled;
        if (twoFactorMethods !== undefined) updates.twoFactorMethods = twoFactorMethods;

        if (currentPassword && newPassword) {
            if (!user.password) {
                return NextResponse.json({ error: "You registered via OAuth and cannot change password here." }, { status: 400 });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
            }

            updates.password = await bcrypt.hash(newPassword, 10);
        }

        if (Object.keys(updates).length > 0) {
            await User.updateOne({ _id: user._id }, { $set: updates });
        }

        return NextResponse.json({ success: true, message: "Profile updated successfully" });
    } catch (error: any) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
