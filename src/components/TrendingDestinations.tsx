"use client";

import { DestinationCard } from "./DestinationCard";
import { Sparkles } from "lucide-react";

const trending = [
  { name: "Maldives", image: "https://source.unsplash.com/800x600/?maldives,island" },
  { name: "Swiss Alps", image: "https://source.unsplash.com/800x600/?switzerland,alps,mountain" },
  { name: "Paris", image: "https://source.unsplash.com/800x600/?paris,landmark" },
  { name: "Goa", image: "https://source.unsplash.com/800x600/?goa,beach" },
  { name: "Manali", image: "https://source.unsplash.com/800x600/?manali,mountain" },
  { name: "Kyoto", image: "https://source.unsplash.com/800x600/?kyoto,temple" },
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
