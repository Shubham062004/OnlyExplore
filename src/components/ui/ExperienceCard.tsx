"use client";

import React, { useState } from "react";
import { Star, Clock, Heart, Share2, Plus, Route, ShieldCheck, Tag, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ExperienceData {
  id: string;
  name: string;
  category: string;
  images: string[];
  duration: string;
  price: string;
  difficulty: string;
  bestTime: string;
  suitableFor: string[];
  rating: number;
  reviewsCount: number;
  description: string;
}

interface ExperienceCardProps {
  experience: ExperienceData;
  destination: string;
  isSaved?: boolean;
  onToggleSave?: (exp: ExperienceData) => void;
  onAddToItinerary?: (exp: ExperienceData) => void;
  onViewRoute?: (exp: ExperienceData) => void;
}

export function ExperienceCard({
  experience,
  destination,
  isSaved = false,
  onToggleSave,
  onAddToItinerary,
  onViewRoute,
}: ExperienceCardProps) {
  const [saved, setSaved] = useState(isSaved);
  const [added, setAdded] = useState(false);

  const mainImage = experience.images?.[0] || "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?q=80&w=800&auto=format&fit=crop";

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved(!saved);
    onToggleSave?.(experience);
  };

  const handleAddItinerary = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAdded(true);
    onAddToItinerary?.(experience);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: experience.name,
        text: `Check out ${experience.name} in ${destination}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${experience.name} in ${destination}: ${window.location.href}`);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <div className="group relative flex flex-col bg-card border border-border/60 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 h-full">
      {/* Image Header */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        <img
          src={mainImage}
          alt={experience.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
            {experience.category}
          </span>
          <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-2.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider">
            {experience.difficulty}
          </span>
        </div>

        {/* Rating & Save Button */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className="flex items-center gap-1 bg-emerald-500 text-white px-2.5 py-1 rounded-xl text-[10px] font-black shadow-lg">
            <Star className="w-3 h-3 fill-current" />
            <span>{experience.rating.toFixed(1)}</span>
          </div>
          <button
            onClick={handleSave}
            className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
              saved ? "bg-red-500 text-white shadow-lg" : "bg-black/40 text-white border border-white/20 hover:bg-black/70"
            }`}
          >
            <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-4 left-5 right-5 space-y-1">
          <div className="flex items-center gap-1 text-white/80 text-[10px] font-bold">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{experience.duration}</span>
            <span>•</span>
            <span>{experience.bestTime}</span>
          </div>
          <h4 className="text-xl font-black font-headline text-white uppercase tracking-tight leading-tight group-hover:text-primary transition-colors truncate">
            {experience.name}
          </h4>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2">
            {experience.description}
          </p>

          {/* Suitable For Tags */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {experience.suitableFor?.slice(0, 3).map((tag, i) => (
              <span key={i} className="px-2.5 py-1 bg-muted rounded-md text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Actions */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Price</span>
              <p className="text-lg font-black text-foreground leading-none mt-0.5">{experience.price}</p>
            </div>
            <Button
              size="sm"
              variant={added ? "secondary" : "default"}
              className="rounded-full font-black uppercase tracking-widest text-[9px] h-9 px-5 shadow-md"
              onClick={handleAddItinerary}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> {added ? "Added!" : "Add To Trip"}
            </Button>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onViewRoute?.(experience)}
              className="flex-1 py-1.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 border border-border/40 transition-colors"
            >
              <Route className="w-3 h-3 text-primary" /> View Route
            </button>
            <button
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-muted/50 hover:bg-muted text-foreground text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-border/40 transition-colors"
            >
              <Share2 className="w-3 h-3" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
