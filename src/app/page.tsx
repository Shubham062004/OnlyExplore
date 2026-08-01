"use client";

import { useEffect, useState } from "react";
import { DestinationSearch } from "@/components/DestinationSearch";
import { HomeCategories } from "@/components/HomeCategories";
import { TrendingDestinations } from "@/components/TrendingDestinations";
import { DestinationCard } from "@/components/DestinationCard";
import { Sidebar } from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { Sparkles, TrendingUp, Heart, Compass, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const RECOMMENDED = [
  { name: "Manali", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop", rating: 4.9, season: "Oct - Feb", budget: "₹14,500", duration: "4 Days" },
  { name: "Leh Ladakh", image: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?q=80&w=800&auto=format&fit=crop", rating: 4.95, season: "May - Sep", budget: "₹24,000", duration: "6 Days" },
  { name: "Shimla", image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?q=80&w=800&auto=format&fit=crop", rating: 4.7, season: "All Year", budget: "₹9,800", duration: "3 Days" },
  { name: "Udaipur", image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=800&auto=format&fit=crop", rating: 4.85, season: "Sep - Mar", budget: "₹16,000", duration: "4 Days" },
];

export default function Home() {
  const router = useRouter();
  const [continueTrip, setContinueTrip] = useState<any | null>(null);

  useEffect(() => {
    // Check if there is a draft trip saved
    fetch("/api/trips?status=Draft")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.length > 0) {
          setContinueTrip(data.data[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex w-full min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        onSelectChat={(id) => { router.push(`/chat/${id}`); }}
        onNewChat={() => { router.push('/chat'); }}
      />
      <div className="flex-1 flex flex-col relative h-screen overflow-y-auto w-full">
        
        {/* Hero Section */}
        <section className="relative w-full py-20 flex flex-col items-center justify-center border-b border-purple-100 bg-gradient-to-b from-purple-600/15 via-purple-100/30 to-background">
          <DestinationSearch />
        </section>

        {/* Continue Planning Banner */}
        {continueTrip && (
          <div className="w-full max-w-7xl mx-auto px-4 mt-8">
            <div className="p-6 rounded-[2.5rem] bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-primary">Resume Planning</div>
                  <h4 className="text-xl font-black font-headline uppercase">{continueTrip.title || continueTrip.destination}</h4>
                  <p className="text-xs text-muted-foreground font-medium">Continue customizing your trip itinerary.</p>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/destination/${encodeURIComponent(continueTrip.destination.toLowerCase())}`)}
                className="rounded-full font-black uppercase tracking-widest text-xs h-10 px-6 shrink-0"
              >
                Continue Trip <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Recommended For You Grid */}
        <div className="w-full max-w-7xl mx-auto px-4 mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                <Heart className="w-3.5 h-3.5" /> Handpicked Recommendations
              </div>
              <h2 className="text-3xl font-black font-headline uppercase tracking-tight">Recommended For You</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {RECOMMENDED.map((rec) => (
              <DestinationCard
                key={rec.name}
                name={rec.name}
                image={rec.image}
                rating={rec.rating}
                season={rec.season}
                budget={rec.budget}
                duration={rec.duration}
              />
            ))}
          </div>
        </div>

        {/* Main Categories Exploration */}
        <div className="w-full max-w-7xl mx-auto flex-1 pb-16">
          <HomeCategories />
          <TrendingDestinations />
        </div>
        
      </div>
    </div>
  );
}
