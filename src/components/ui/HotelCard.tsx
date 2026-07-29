"use client";

import React, { useState } from "react";
import { Star, MapPin, ExternalLink, Copy, Check, Heart, Wifi, ShieldCheck, Clock, Navigation, Hotel as HotelIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface HotelData {
  id: string;
  name: string;
  heroImage: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  priceValue?: number;
  address: string;
  distanceFromCenter: string;
  distanceFromAttractions: string;
  checkIn: string;
  checkOut: string;
  amenities: string[];
  tags: string[];
  officialWebsite?: string;
}

interface HotelCardProps {
  hotel: HotelData;
  destination: string;
  isFavorite?: boolean;
  onToggleFavorite?: (hotel: HotelData) => void;
  onViewDetails?: (hotel: HotelData) => void;
}

export function HotelCard({
  hotel,
  destination,
  isFavorite = false,
  onToggleFavorite,
  onViewDetails,
}: HotelCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorite(!favorite);
    onToggleFavorite?.(hotel);
  };

  const handleCopyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hotel.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  return (
    <div
      onClick={() => onViewDetails?.(hotel)}
      className="group relative flex flex-col bg-card border border-border/60 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer h-full"
    >
      {/* Image Area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <img
          src={hotel.heroImage || "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop"}
          alt={hotel.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
            {hotel.tags?.[0] || "Stay"}
          </span>
        </div>

        {/* Favorite Button & Rating */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-xl text-[10px] font-black shadow-lg">
            <Star className="w-3 h-3 fill-current" />
            <span>{hotel.rating.toFixed(1)}</span>
            <span className="opacity-80 text-[8px]">({hotel.reviewCount})</span>
          </div>
          <button
            onClick={handleFavoriteClick}
            className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
              favorite ? "bg-red-500 text-white shadow-lg" : "bg-black/40 text-white border border-white/20 hover:bg-black/70"
            }`}
          >
            <Heart className={`w-4 h-4 ${favorite ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Bottom Image Overlay text */}
        <div className="absolute bottom-4 left-5 right-5 space-y-1">
          <div className="flex items-center gap-1 text-white/80 text-[10px] font-bold">
            <MapPin className="w-3 h-3 text-primary" />
            <span className="truncate">{hotel.distanceFromCenter}</span>
          </div>
          <h4 className="text-xl font-black font-headline text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors truncate">
            {hotel.name}
          </h4>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Distances & Times */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-muted-foreground bg-muted/30 p-3 rounded-2xl border border-border/30">
            <div className="flex items-center gap-1.5 truncate">
              <Navigation className="w-3 h-3 text-primary shrink-0" />
              <span className="truncate">{hotel.distanceFromAttractions}</span>
            </div>
            <div className="flex items-center gap-1.5 justify-end shrink-0">
              <Clock className="w-3 h-3 text-primary shrink-0" />
              <span>In: {hotel.checkIn}</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {hotel.amenities?.slice(0, 4).map((amenity, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-muted rounded-lg text-[9px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1"
              >
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" /> {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Price Range</span>
              <p className="text-lg font-black text-foreground leading-none mt-0.5">{hotel.priceRange}</p>
            </div>
            <Button
              size="sm"
              className="rounded-full font-black uppercase tracking-widest text-[9px] h-9 px-5 shadow-md shadow-primary/20"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.(hotel);
              }}
            >
              View Details
            </Button>
          </div>

          {/* Secondary Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.name + " " + destination)}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 py-1.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-border/40 transition-colors"
            >
              Open Maps <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={handleCopyAddress}
              className="px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-border/40 transition-colors"
            >
              {copiedAddress ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
              Address
            </button>
            {hotel.officialWebsite && (
              <a
                href={hotel.officialWebsite}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-primary/20 transition-colors"
              >
                Website <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
