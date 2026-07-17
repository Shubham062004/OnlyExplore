"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
    const { data: session } = useSession();

    if (!session || !session.user) {
        return <div className="p-8 text-white">Please sign in to view your profile.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-8 mt-10 space-y-8 bg-zinc-950 border border-zinc-900 rounded-lg text-white">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Your Profile</h1>
                <p className="text-zinc-400 mt-2">Manage your account and view your active privileges.</p>
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
                    <div className="font-semibold text-zinc-300 w-24">Status</div>
                    <div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            FULL PREMIUM ACCESS (FREE)
                        </span>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-zinc-800">
                <h2 className="text-xl font-semibold mb-4 text-zinc-100">Features Unlocked</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-zinc-400">
                    <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                        <h3 className="font-bold text-zinc-200 mb-1">🗺️ Interactive Maps</h3>
                        <p>Access full geolocated mapping, route timelines, and local hotspots powered by MapBox.</p>
                    </div>
                    <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                        <h3 className="font-bold text-zinc-200 mb-1">🤖 Advanced AI Planner</h3>
                        <p>Generate highly detailed itineraries with emergency contacts, weather forecasts, and checklists.</p>
                    </div>
                    <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                        <h3 className="font-bold text-zinc-200 mb-1">🧳 Dynamic Destination Guides</h3>
                        <p>Explore real-time synthesized city summaries, verified visitor sentiment, and packing guides.</p>
                    </div>
                    <div className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                        <h3 className="font-bold text-zinc-200 mb-1">⚡ Real-Time Adjustments</h3>
                        <p>Instantly adapt and modify your generated plans by chatting with your travel assistant in plain English.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
