import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user || !user.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    user.subscriptionStatus = "canceled";
    user.plan = "free";
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Stripe Cancel Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
