"use client";

import { DestinationCard } from "./DestinationCard";
import { Sparkles } from "lucide-react";

const trending = [
  { name: "Maldives", image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800" },
  { name: "Swiss Alps", image: "https://images.unsplash.com/photo-1531224353844-323a7efd2566?auto=format&fit=crop&q=80&w=800" },
  { name: "Paris", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&q=80&w=800" },
  { name: "Goa", image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&q=80&w=800" },
  { name: "Manali", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800" },
  { name: "Kyoto", image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&q=80&w=800" },
];

export function TrendingDestinations() {
  return (
    <div className="w-full mt-16 px-4 pb-8 border-b border-border/50">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-accent" />
        <h2 className="text-2xl font-bold font-headline">Trending destinations</h2>
      </div>

      <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 px-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {trending.map((dest, i) => (
          <div key={i} className="snap-start shrink-0">
            <DestinationCard name={dest.name} image={dest.image} />
          </div>
        ))}
      </div>
    </div>
  );
}
