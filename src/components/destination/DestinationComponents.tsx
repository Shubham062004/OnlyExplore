"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import {
  Building, MapPin, Thermometer, Mountain, Users,
  Star, Map as MapIcon, Calendar, Zap, Hotel,
  ChevronRight, ChevronLeft, Clock, Tag,
  ArrowRight, ExternalLink, Heart, Share2,
  Navigation, Info, Compass, Coffee
} from "lucide-react";
import { formatAltitude, getTemperatureRange, formatLocation } from "@/lib/destinations";
import { ExplorerPoint } from "@/lib/explorer";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop";

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
export function DestinationSkeleton() {
  return (
    <div className="w-full flex-col space-y-12 pb-12">
      <Skeleton className="w-full h-[520px] md:h-[640px] rounded-b-[3rem] md:rounded-b-[4rem] bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto px-6 -mt-20 relative z-30">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[2.5rem] bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-6 w-full">
        <Skeleton className="w-full h-[320px] rounded-[3rem] mt-12 bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Facts
// ─────────────────────────────────────────────────────────────────────────────
export function QuickFacts({ facts, destination }: { facts: any; destination: string }) {
  if (!facts) return null;

  const altitudeStr = formatAltitude(facts.altitude);
  const tempObj = getTemperatureRange(destination, facts.temperature || facts.avgTemp);
  const locationStr = formatLocation(destination, facts.location);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 -mt-12 md:-mt-16 relative z-30 px-2">
      {[
        { 
          icon: <Mountain className="w-7 h-7 text-indigo-500/90 stroke-[1.5]" />, 
          label: "Altitude", 
          value: altitudeStr 
        },
        { 
          icon: <Calendar className="w-7 h-7 text-orange-500/90 stroke-[1.5]" />, 
          label: "Best Time", 
          value: facts.bestTime || "N/A" 
        },
        { 
          icon: <Thermometer className="w-7 h-7 text-red-500/90 stroke-[1.5]" />, 
          label: "Temperature", 
          value: tempObj.formatted 
        },
        { 
          icon: <MapPin className="w-7 h-7 text-teal-500/90 stroke-[1.5]" />, 
          label: "Location", 
          value: locationStr 
        },
      ].map((f, i) => (
        <div 
          key={i} 
          className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-white/40 dark:border-white/5 rounded-[2.5rem] p-8 md:p-9 min-h-[160px] flex flex-row items-center justify-between hover:-translate-y-3 hover:shadow-primary/10 transition-all duration-700 ease-out group cursor-default"
        >
          <div className="flex flex-col justify-center gap-2">
            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-60 leading-none">{f.label}</span>
            <span className="font-black text-xl md:text-2xl text-foreground leading-none tracking-tight">{f.value}</span>
          </div>
          <div className="bg-primary/5 p-5 rounded-[2rem] shrink-0 group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-700 ease-out flex items-center justify-center">
            {f.icon}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Map Explorer (Interactive)
// ─────────────────────────────────────────────────────────────────────────────
export const MapExplorer = memo(function MapExplorer({ 
  points, 
  destination,
  activeIndex,
  onIndexChange
}: { 
  points: ExplorerPoint[]; 
  destination: string;
  activeIndex: number;
  onIndexChange: (idx: number) => void;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const activePoint = points[activeIndex] || points[0];
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePrev = useCallback(() => {
    onIndexChange((activeIndex - 1 + points.length) % points.length);
  }, [activeIndex, points.length, onIndexChange]);

  const handleNext = useCallback(() => {
    onIndexChange((activeIndex + 1) % points.length);
  }, [activeIndex, points.length, onIndexChange]);

  if (!isMounted) {
    return <div className="h-[600px] w-full bg-muted/30 animate-pulse rounded-[3rem] border border-border/50" />;
  }

  if (!activePoint) return null;

  return (
    <div className="space-y-10 mt-24 mb-24 scroll-mt-32" id="map-explorer">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="space-y-3 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in border border-primary/20 mx-auto lg:mx-0">
            <MapIcon className="w-4 h-4" /> Destination Discovery
          </div>
          <h3 className="text-4xl md:text-6xl font-black font-headline uppercase leading-none tracking-tighter">
            Navigate <span className="text-primary">{destination}</span> Like a Local
          </h3>
          <p className="text-muted-foreground font-medium text-lg">
            An interactive explorer syncing the best attractions, stays, and hidden activities in {destination}.
          </p>
        </div>
        <div className="flex items-center gap-4">
           <div className="text-right hidden sm:block">
             <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currently Exploring</div>
             <div className="text-sm font-bold text-primary">{activePoint.name}</div>
           </div>
           <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-2xl shadow-primary/30">
             <Navigation className="w-7 h-7" />
           </div>
        </div>
      </div>

      <div className="relative h-[800px] w-full rounded-[4rem] overflow-hidden border border-border/50 shadow-[0_30px_100px_rgba(0,0,0,0.1)] bg-card group/map">
        <div className="absolute inset-0 flex flex-col lg:flex-row">
          {/* Map Area */}
          <div className="flex-1 relative bg-zinc-100 dark:bg-zinc-950 overflow-hidden">
            <iframe
              key={activePoint.id}
              className="absolute inset-0 w-full h-full grayscale-[0.2] invert-[0.05] dark:invert-[0.9] opacity-90 contrast-[1.1] transition-all duration-1000"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(activePoint.name + " " + destination)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              title="Interactive Map"
            />
            
            {/* Custom Marker Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative pointer-events-auto">
                  <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center animate-ping absolute -inset-0" />
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white shadow-[0_0_50px_rgba(var(--primary),0.6)] border-4 border-white dark:border-zinc-900 cursor-pointer animate-bounce relative z-10">
                    {activePoint.type === "stay" ? <Hotel className="w-7 h-7" /> : activePoint.type === "activity" ? <Zap className="w-7 h-7" /> : <MapPin className="w-7 h-7" />}
                  </div>
                </div>
            </div>

            {/* Float Info Card */}
            <div className="absolute bottom-10 left-10 p-6 bg-background/80 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-2xl max-w-sm hidden md:block animate-in slide-in-from-bottom-5 duration-500">
               <div className="flex items-center gap-2 mb-2">
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">{activePoint.category}</span>
                 <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                 <span className="text-[10px] font-bold text-muted-foreground">{activePoint.rating} Rating</span>
               </div>
               <div className="text-xl font-black font-headline uppercase tracking-tight mb-2">{activePoint.name}</div>
               <div className="flex gap-2">
                 <Button size="sm" variant="outline" className="rounded-xl h-8 text-[10px] font-black uppercase" asChild>
                   <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activePoint.name + " " + destination)}`} target="_blank">Get Directions</a>
                 </Button>
               </div>
            </div>
          </div>

          {/* Side Info & List Panel */}
          <div className="w-full lg:w-[480px] h-[400px] lg:h-full bg-background/95 backdrop-blur-3xl border-l border-border/50 flex flex-col z-20 shadow-[-30px_0_100px_rgba(0,0,0,0.15)]">
            <div className="p-8 md:p-10 flex-1 overflow-y-auto space-y-8 scrollbar-hide">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <span className="px-5 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {activePoint.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-orange-500 bg-orange-500/10 px-4 py-1.5 rounded-full">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-xs font-black tracking-widest">{activePoint.rating}</span>
                  </div>
                </div>
                <h4 className="text-4xl font-black font-headline uppercase leading-[0.85] tracking-tighter">
                  {activePoint.name}
                </h4>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                  {activePoint.description}
                </p>
              </div>

              {/* Stats & Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-muted/30 rounded-3xl border border-border/30 group hover:border-primary/30 transition-all duration-500">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Best Experience</div>
                  <div className="text-xs font-bold flex items-center gap-2.5">
                    <Clock className="w-4.5 h-4.5 text-primary" /> {activePoint.bestTime}
                  </div>
                </div>
                <div className="p-6 bg-muted/30 rounded-3xl border border-border/30 group hover:border-primary/30 transition-all duration-500">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Est. Duration</div>
                  <div className="text-xs font-bold flex items-center gap-2.5">
                    <Calendar className="w-4.5 h-4.5 text-primary" /> {activePoint.duration}
                  </div>
                </div>
              </div>

              {/* Tags Area */}
              {activePoint.tags && activePoint.tags.length > 0 && (
                <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Highlights</div>
                  <div className="flex flex-wrap gap-2">
                    {activePoint.tags.map((tag, i) => (
                      <span key={i} className="px-4 py-2 bg-muted/50 border border-border/20 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-default">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <Button className="flex-1 rounded-[2rem] h-16 font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all" asChild>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activePoint.name + " " + destination)}`} target="_blank">
                    Explore on Google Maps <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </div>

            {/* Visual Navigation Bar */}
            <div className="p-10 border-t border-border/50 bg-muted/10">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">Discover More Spots</div>
                <div className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full">{activeIndex + 1} / {points.length}</div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide px-2">
                {points.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => onIndexChange(i)}
                    className={`shrink-0 w-24 h-24 rounded-[2rem] overflow-hidden border-2 transition-all duration-500 relative group/thumb ${
                      i === activeIndex ? "border-primary scale-110 shadow-2xl z-10" : "border-transparent opacity-40 hover:opacity-100"
                    }`}
                  >
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-110" />
                    {i === activeIndex && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <button 
                  onClick={handlePrev}
                  className="w-14 h-14 rounded-full bg-background border border-border/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90 group/btn"
                >
                  <ChevronLeft className="w-6 h-6 group-hover/btn:-translate-x-1 transition-transform" />
                </button>
                <div className="flex gap-2.5">
                  {points.slice(0, 8).map((_, i) => (
                    <div key={i} className={`h-1.5 rounded-full transition-all duration-700 ${i === activeIndex % 8 ? "bg-primary w-10 shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-muted-foreground/20 w-1.5"}`} />
                  ))}
                </div>
                <button 
                  onClick={handleNext}
                  className="w-14 h-14 rounded-full bg-background border border-border/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-xl active:scale-90 group/btn"
                >
                  <ChevronRight className="w-6 h-6 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Popular Places — Premium Exploration System
// ─────────────────────────────────────────────────────────────────────────────
const PlaceCard = memo(({ 
  place, 
  isActive, 
  onClick,
  onViewDetails
}: { 
  place: ExplorerPoint; 
  isActive: boolean; 
  onClick: () => void;
  onViewDetails: (p: any) => void;
}) => {
  return (
    <div 
      onClick={onClick}
      className={`group relative h-[520px] rounded-[3rem] overflow-hidden cursor-pointer transition-all duration-700 bg-zinc-100 dark:bg-zinc-800 border ${
        isActive 
          ? "ring-4 ring-primary ring-offset-4 ring-offset-background scale-[1.02] shadow-2xl shadow-primary/20 z-10" 
          : "border-border/50 hover:border-primary/40 shadow-xl shadow-black/5"
      }`}
    >
      {/* Background Image */}
      <img 
        src={place.image || FALLBACK_IMAGE} 
        alt={place.name} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
      />
      
      {/* Dynamic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Content Container */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between">
        {/* Top Badges */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <span className="inline-flex bg-primary/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg">
              {place.category}
            </span>
            {isActive && (
              <span className="inline-flex bg-white text-black text-[9px] font-black uppercase tracking-[0.1em] px-3 py-1.5 rounded-full animate-pulse self-start shadow-md">
                Exploring Now
              </span>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onViewDetails(place); }}
            className="w-11 h-11 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-primary hover:scale-110 transition-all duration-300"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 text-orange-400 px-3 py-1.5 rounded-full">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-[11px] font-black tracking-widest">{place.rating}</span>
            </div>
            {place.bestTime && (
              <div className="flex items-center gap-1.5 bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-full">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black tracking-widest uppercase">{place.bestTime}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-3xl font-black font-headline text-white uppercase leading-none tracking-tighter group-hover:text-primary transition-colors">
              {place.name}
            </h4>
            <p className="text-zinc-300 text-sm font-medium line-clamp-2 leading-relaxed opacity-90 group-hover:opacity-100 transition-opacity">
              {place.description}
            </p>
          </div>

          {/* Expanded Tags on Hover */}
          <div className="flex flex-wrap gap-2 pt-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100">
            {place.tags?.slice(0, 3).map((tag, i) => (
              <span key={i} className="bg-white/10 border border-white/20 text-white/80 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          {/* CTA Row */}
          <div className="flex items-center justify-between pt-4 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-200">
             <button 
               onClick={(e) => { e.stopPropagation(); onViewDetails(place); }}
               className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:underline"
             >
               View Details <ArrowRight className="w-4 h-4" />
             </button>
             <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
               {place.duration}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export const PopularPlaces = memo(function PopularPlaces({
  places,
  destination,
  activeIndex,
  onIndexChange,
  onPlaceClick
}: {
  places: ExplorerPoint[];
  destination: string;
  activeIndex: number;
  onIndexChange: (idx: number) => void;
  onPlaceClick: (place: any) => void;
}) {
  const [filter, setFilter] = useState("All");
  
  const categories = useMemo(() => ["All", ...new Set(places.map(p => p.category))].slice(0, 8), [places]);
  const filteredPlaces = useMemo(() => filter === "All" ? places : places.filter(p => p.category === filter), [filter, places]);

  if (places.length === 0) return null;

  return (
    <div className="space-y-16 mt-32 mb-32 scroll-mt-32" id="popular-places">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] animate-fade-in">
            <Compass className="w-4 h-4" /> Destination Highlights
          </div>
          <h3 className="text-5xl md:text-7xl font-black font-headline uppercase leading-[0.85] tracking-tighter">
            Uncover <span className="text-primary">Hidden</span> Gems in {destination}
          </h3>
          <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
            From legendary landmarks to secretive local favorites, explore the most immersive experiences {destination} has to offer.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => setFilter(cat)}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all duration-500 whitespace-nowrap ${
                filter === cat 
                  ? "bg-primary text-white border-primary shadow-[0_10px_30px_rgba(var(--primary),0.3)] scale-105" 
                  : "bg-background hover:bg-muted border-border hover:border-primary/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredPlaces.map((place) => {
          const globalIndex = places.indexOf(place);
          const isActive = globalIndex === activeIndex;

          return (
            <PlaceCard 
              key={place.id}
              place={place}
              isActive={isActive}
              onClick={() => {
                onIndexChange(globalIndex);
                document.getElementById('map-explorer')?.scrollIntoView({ behavior: 'smooth' });
              }}
              onViewDetails={onPlaceClick}
            />
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-center pt-8">
        <Button variant="outline" className="rounded-full px-12 h-16 border-2 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary hover:text-white transition-all duration-500 shadow-xl shadow-black/5 group">
          Explore All Places <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
        </Button>
      </div>
    </div>
  );
});


// ─────────────────────────────────────────────────────────────────────────────
// Trip Planner CTA
// ─────────────────────────────────────────────────────────────────────────────
export function TripPlannerCTA({ destination }: { destination: string }) {
  const router = useRouter();
  return (
    <div className="w-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-[2rem] p-8 md:p-12 text-white shadow-2xl mt-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-5 border border-white/30">
            <Zap className="w-3 h-3" /> AI-Powered Trip Planner
          </div>
          <h3 className="text-3xl md:text-5xl font-bold font-headline mb-4 leading-tight">
            Plan your perfect trip<br />in seconds
          </h3>
          <p className="text-blue-100 text-base md:text-lg max-w-lg mb-6">
            Our AI crafts personalized daily itineraries based on your interests, budget, and travel style — specific to {destination}.
          </p>
          <div className="flex flex-col gap-3">
            {[
              `Plan a budget-friendly ${destination} trip with friends`,
              `Create a 5-day adventure-focused itinerary for ${destination}`,
              `Suggest a ₹5000 per person budget trip to ${destination}`,
              `Plan a relaxing ${destination} trip with scenic spots and cafes`,
              `Build a short 3-day ${destination} itinerary with must-visit places`
            ].map((text) => (
              <button
                key={text}
                onClick={() => router.push(`/chat?query=${encodeURIComponent(text)}&destination=${encodeURIComponent(destination)}`)}
                className="px-6 py-3 rounded-full bg-white/20 hover:bg-white/30 transition text-left text-sm font-medium border border-white/10"
              >
                {text}
              </button>
            ))}
          </div>
        </div>

        {/* Mock chat preview */}
        <div className="hidden lg:flex flex-col w-[300px] bg-white text-black p-4 rounded-2xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 border border-border shrink-0">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">Trip Assistant</p>
              <p className="text-[10px] text-muted-foreground">Online · Ready</p>
            </div>
          </div>
          <div className="bg-muted p-3 rounded-xl rounded-tl-none text-sm mb-3">
            Planning a trip to {destination}? I can build your itinerary!
          </div>
          <div className="bg-blue-500 text-white p-3 rounded-xl rounded-tr-none text-sm self-end mb-3 ml-8">
            Yes! 4 days, adventure focus.
          </div>
          <div className="bg-muted p-3 rounded-xl rounded-tl-none text-sm">
            Perfect. Day 1 is ready. Shall I add hotel options?
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Adventure Activities — with price + Book Now CTA
// ─────────────────────────────────────────────────────────────────────────────
export function AdventureActivities({ 
  activities, 
  destination 
}: { 
  activities: any[]; 
  destination: string 
}) {
  const router = useRouter();
  if (!activities || activities.length === 0) return null;

  return (
    <div className="space-y-10 mt-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h3 className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tighter">Adventure & Experiences</h3>
          <p className="text-muted-foreground font-medium">Curated thrills and immersive cultural journeys in {destination}</p>
        </div>
        <Button
          variant="outline"
          className="rounded-full font-black uppercase tracking-widest text-[10px] h-12 px-8 border-2 hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/5"
          onClick={() => router.push(`/chat?destination=${encodeURIComponent(destination)}&prompt=activities`)}
        >
          View All Activities <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {activities.map((activity, idx) => (
          <div key={idx} className="group bg-card border border-border/50 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col shadow-xl shadow-black/5">
            <div className="relative h-64 w-full overflow-hidden">
              <img
                src={activity.image || FALLBACK_IMAGE}
                alt={activity.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              <div className="absolute top-4 left-4">
                 <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                   {activity.category || activity.bestSeason || 'Adventure'}
                 </span>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-black font-headline uppercase tracking-tight text-xl leading-none">{activity.name}</h4>
                  <div className="flex items-center gap-1 text-orange-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-current" /> {activity.rating || '4.8'}
                  </div>
                </div>
                <p className="text-muted-foreground text-sm font-medium line-clamp-2 leading-relaxed">
                  {activity.description || activity.location || `Experience the best of ${activity.name} in the heart of ${destination}.`}
                </p>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{activity.duration || '2-3 Hours'}</span>
                </div>
                <Button 
                  variant="ghost" 
                  className="text-primary hover:text-primary hover:bg-primary/5 font-black uppercase tracking-widest text-[9px] p-0 h-auto"
                  onClick={() => router.push(`/chat?destination=${encodeURIComponent(destination)}&prompt=${encodeURIComponent(`Book ${activity.name}`)}`)}
                >
                  Book Experience <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stay Recommendations — with real price, rating, and View Deal CTA
// ─────────────────────────────────────────────────────────────────────────────
export function StayRecommendations({
  hotels,
  destination,
}: {
  hotels: any[];
  destination: string;
}) {
  const router = useRouter();
  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="space-y-10 mt-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-1">
          <h3 className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tighter">Luxury Retreats</h3>
          <p className="text-muted-foreground font-medium">From boutique stays to heritage resorts in {destination}</p>
        </div>
        <Button
          variant="outline"
          className="rounded-full font-black uppercase tracking-widest text-[10px] h-12 px-8 border-2 hover:bg-primary hover:text-white transition-all shadow-xl shadow-black/5"
          onClick={() => router.push(`/chat?destination=${encodeURIComponent(destination)}&prompt=hotels`)}
        >
          Explore All Stays <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {hotels.map((hotel, idx) => (
          <div key={idx} className="group bg-card border border-border/50 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col shadow-xl shadow-black/5">
            <div className="relative h-56 w-full overflow-hidden">
              <img
                src={hotel.image || FALLBACK_IMAGE}
                alt={hotel.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              <div className="absolute top-4 left-4">
                 <span className="px-4 py-1.5 bg-primary/90 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                   {hotel.type || 'Stay'}
                 </span>
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-black font-headline uppercase tracking-tight text-lg leading-tight group-hover:text-primary transition-colors">{hotel.name}</h4>
                  <div className="flex items-center gap-1 bg-orange-500/10 text-orange-500 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                    <Star className="w-3 h-3 fill-current" />
                    {hotel.rating?.toFixed(1) || '4.5'}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-border/50 mt-6">
                <div>
                  <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Starts From</span>
                  <p className="font-black text-lg leading-none mt-1">{hotel.price || "On request"}</p>
                </div>
                <Button
                  size="sm"
                  className="rounded-xl font-black uppercase tracking-widest text-[9px] px-5 h-10 shadow-lg shadow-primary/20"
                  onClick={() => router.push(`/chat?destination=${encodeURIComponent(destination)}&prompt=${encodeURIComponent(`Book ${hotel.name}`)}`)}
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Itinerary — day-by-day cards
// ─────────────────────────────────────────────────────────────────────────────
export function ItinerarySection({ 
  itinerary, 
  destination 
}: { 
  itinerary: any[]; 
  destination: string 
}) {
  if (!itinerary || itinerary.length === 0) return null;

  return (
    <div className="space-y-12 mt-32 relative">
      <div className="flex flex-col items-center text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">
          <Calendar className="w-4 h-4" /> Perfect Itinerary
        </div>
        <h3 className="text-4xl md:text-6xl font-black font-headline uppercase tracking-tighter">
          Your <span className="text-primary">Day-by-Day</span> Journey
        </h3>
        <p className="text-muted-foreground max-w-2xl font-medium text-lg leading-relaxed">
          A masterfully curated route through {destination}, balancing adventure, culture, and relaxation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {itinerary.map((day, idx) => (
          <div
            key={idx}
            className="group relative bg-card border border-border/50 rounded-[3rem] p-8 hover:shadow-2xl transition-all duration-500 shadow-xl shadow-black/5 flex flex-col"
          >
            {/* Day Number */}
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary font-black text-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
              {day.day}
            </div>
            
            <h4 className="font-black font-headline uppercase text-xl mb-6 leading-none tracking-tight group-hover:text-primary transition-colors">
              {day.title}
            </h4>
            
            <div className="space-y-4 flex-1">
              {(day.places as string[]).map((place: string, i: number) => (
                <div key={i} className="flex items-start gap-3 text-sm text-muted-foreground group/item">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/30 mt-1.5 shrink-0 group-hover/item:bg-primary transition-colors" />
                  <span className="font-medium group-hover/item:text-foreground transition-colors">{place}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
               <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:underline">
                 Explore Locations <ArrowRight className="w-3.5 h-3.5" />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rentals
// ─────────────────────────────────────────────────────────────────────────────
export function RentalsSection({ rentals }: { rentals: any[] }) {
  if (!rentals || rentals.length === 0) return null;
  return (
    <div className="space-y-6 mt-16">
      <h3 className="text-2xl font-bold font-headline">Rentals & Transport</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {rentals.map((rental, idx) => (
          <div key={idx} className="bg-card border rounded-2xl p-5 text-center shadow-sm hover:shadow-lg transition-all flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <h4 className="font-bold text-sm">{rental.type}</h4>
            <p className="text-sm text-primary font-bold">{rental.cost}/day</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Nearby Destinations
// ─────────────────────────────────────────────────────────────────────────────
export function NearbyDestinations({ nearby }: { nearby: any[] }) {
  if (!nearby || nearby.length === 0) return null;
  return (
    <div className="space-y-10 mt-32">
      <div className="space-y-2">
        <h3 className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tighter">Beyond the Horizon</h3>
        <p className="text-muted-foreground font-medium">Extend your journey to these stunning nearby locations</p>
      </div>
      
      <div className="flex overflow-x-auto pb-10 gap-8 scrollbar-hide snap-x md:grid md:grid-cols-4 md:overflow-visible">
        {nearby.map((place, idx) => (
          <div key={idx} className="min-w-[280px] md:min-w-0 snap-center bg-card border border-border/50 rounded-[3rem] overflow-hidden hover:shadow-2xl transition-all duration-500 group shadow-xl shadow-black/5">
            <div className="h-44 relative overflow-hidden bg-muted">
              <img
                src={`https://images.unsplash.com/featured/800x450/?${encodeURIComponent(place.name)},travel,landscape`}
                alt={place.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
              <div className="absolute bottom-4 left-6">
                 <div className="flex items-center gap-2 text-white/90">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{place.distance || 'Nearby'}</span>
                 </div>
              </div>
            </div>
            <div className="p-8">
              <h4 className="font-black font-headline uppercase text-xl leading-none group-hover:text-primary transition-colors">{place.name}</h4>
              <Button variant="link" className="p-0 h-auto mt-4 text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                Explore Destination <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Travel Tips
// ─────────────────────────────────────────────────────────────────────────────
export function TravelTips({ tips }: { tips: string[] }) {
  if (!tips || tips.length === 0) return null;
  return (
    <div className="bg-card border border-border/50 rounded-[3rem] p-10 shadow-xl shadow-black/5 h-full space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 text-blue-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">
          <Compass className="w-3.5 h-3.5" /> Essential Advice
        </div>
        <h3 className="text-3xl font-black font-headline uppercase tracking-tighter">Pro Travel Tips</h3>
      </div>
      <div className="space-y-6">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex gap-4 items-start group">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-black group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              {idx + 1}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium pt-1 group-hover:text-foreground transition-colors">{tip}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Packing Guide
// ─────────────────────────────────────────────────────────────────────────────
export function PackingGuide({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-card border border-border/50 rounded-[3rem] p-10 shadow-xl shadow-black/5 h-full space-y-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
          <Zap className="w-3.5 h-3.5" /> Smart Prep
        </div>
        <h3 className="text-3xl font-black font-headline uppercase tracking-tighter">Packing Checklist</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 transition-all group">
            <div className="w-6 h-6 rounded-lg border-2 border-emerald-500/30 flex items-center justify-center bg-white dark:bg-zinc-900 group-hover:border-emerald-500 group-hover:bg-emerald-500 transition-all duration-300 shrink-0 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 group-hover:text-white"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
