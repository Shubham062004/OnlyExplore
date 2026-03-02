"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    if (!session) {
        return <div className="p-8 text-white">Please sign in to view your profile.</div>;
    }

    const isPro = (session.user as any).plan === "pro";

    const handleUpgrade = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/stripe/checkout", { method: "POST" });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async () => {
        try {
            setLoading(true);
            await fetch("/api/stripe/cancel", { method: "POST" });
            await update();
            router.refresh();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-8 mt-10 space-y-8 bg-zinc-950 border border-zinc-900 rounded-lg text-white">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Your Profile</h1>
                <p className="text-zinc-400 mt-2">Manage your account and subscription preferences.</p>
            </div>

            <div className="space-y-4 bg-zinc-900/50 p-6 rounded-md border border-zinc-800">
                <div className="flex gap-4 items-center">
                    <div className="font-semibold text-zinc-300 w-24">Name</div>
                    <div className="text-zinc-100">{session.user.name || "N/A"}</div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="font-semibold text-zinc-300 w-24">Email</div>
                    <div className="text-zinc-100">{session.user.email}</div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="font-semibold text-zinc-300 w-24">Plan</div>
                    <div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPro ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}>
                            {isPro ? "PRO" : "FREE"}
                        </span>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-zinc-100">Billing & Features</h2>
                {!isPro ? (
                    <div>
                        <p className="text-zinc-400 mb-4 text-sm">Upgrade to Pro to unlock unlimited features and priority access.</p>
                        <button
                            onClick={handleUpgrade}
                            disabled={loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-md shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? "Loading checkout..." : "Upgrade to Pro"}
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="text-zinc-400 mb-4 text-sm">You are currently subscribed to the Pro plan. Thank you for your support!</p>
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="px-6 py-2.5 bg-zinc-800 hover:bg-red-600/90 text-zinc-300 hover:text-white border border-zinc-700 hover:border-red-600 text-sm font-semibold rounded-md transition-all disabled:opacity-50"
                        >
                            {loading ? "Processing..." : "Cancel Subscription"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
