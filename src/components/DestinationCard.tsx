"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star, Calendar, CircleDollarSign, ArrowUpRight } from "lucide-react";

interface DestinationCardProps {
  name: string;
  image: string;
  slug?: string;
  rating?: number;
  season?: string;
  budget?: string;
  duration?: string;
}

export function DestinationCard({
  name,
  image,
  slug,
  rating = 4.8,
  season = "Oct - Mar",
  budget = "₹12,000",
  duration = "3-5 Days",
}: DestinationCardProps) {
  const router = useRouter();
  const [imgSrc, setImgSrc] = useState(image);

  const destination = slug || name.toLowerCase().replace(/\s+/g, "-");
  const navigate = () => router.push(`/destination/${encodeURIComponent(destination)}`);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate();
    }
  };

  return (
    <div
      onClick={navigate}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View destination guide for ${name}`}
      className="group relative cursor-pointer rounded-[2rem] border border-border/60 bg-card overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 transform hover:-translate-y-2 w-[220px] sm:w-[260px] md:w-[300px] shrink-0 outline-none"
    >
      <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onError={() => setImgSrc("/assets/default.jpg")}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span className="bg-amber-500 text-white px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-lg">
            <Star className="w-3 h-3 fill-current" /> {rating.toFixed(1)}
          </span>
          <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
            {duration}
          </span>
        </div>

        {/* Bottom Details Overlay */}
        <div className="absolute bottom-4 left-4 right-4 space-y-2 text-white">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-xl font-black uppercase tracking-tight leading-none drop-shadow-md group-hover:text-primary transition-colors truncate">
              {name}
            </h3>
            <ArrowUpRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </div>

          {/* Season & Budget Pills */}
          <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-300">
            <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              <Calendar className="w-3 h-3 text-primary" /> {season}
            </span>
            <span className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              <CircleDollarSign className="w-3 h-3 text-emerald-400" /> {budget}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
