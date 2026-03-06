import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({ invoices: [] }, { status: 200 });
    }

    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 10,
    });

    let nextBillingDate: number | null = null;
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        nextBillingDate = (subscription as any).current_period_end;
      } catch (err) {
        console.error("Failed to fetch subscription for next billing date", err);
      }
    }

    const mappedInvoices = invoices.data.map((inv) => ({
      id: inv.id,
      created: inv.created, // Unix timestamp format
      amount_paid: inv.amount_paid,
      status: inv.status,
      invoice_pdf: inv.invoice_pdf,
      hosted_invoice_url: inv.hosted_invoice_url,
      currency: inv.currency,
    }));

    return NextResponse.json({ invoices: mappedInvoices, nextBillingDate });
  } catch (error: any) {
    console.error("Stripe Invoices Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
