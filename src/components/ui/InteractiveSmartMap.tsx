"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  MapPin, Navigation, Clock, Star, ExternalLink, Copy, Check,
  Compass, Hotel, Utensils, Zap, ShieldAlert, HeartPulse, ShoppingBag,
  Car, CreditCard, Fuel, Filter, ArrowRight, Route, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MapMarker {
  id: string;
  name: string;
  category: "Attractions" | "Food" | "Hotels" | "Rentals" | "Medical" | "Emergency" | "Shopping";
  subCategory?: string;
  rating?: number;
  distance?: string;
  openingHours?: string;
  image?: string;
  description?: string;
  coordinates: { lat: number; lng: number };
}

export interface RoutePlan {
  waypoints: Array<{ label: string; name: string; category: string; coordinates: { lat: number; lng: number } }>;
  metrics: {
    totalDistanceKm: number;
    drivingTimeMins: number;
    walkingTimeMins: number;
    formattedDriving: string;
    formattedWalking: string;
  };
}

interface InteractiveSmartMapProps {
  destination: string;
  initialMarkers?: MapMarker[];
  center?: { lat: number; lng: number };
  onMarkerSelect?: (marker: MapMarker) => void;
}

const CATEGORIES = [
  { id: "All", label: "All Spots", icon: Compass },
  { id: "Attractions", label: "Attractions", icon: MapPin },
  { id: "Food", label: "Food & Dining", icon: Utensils },
  { id: "Hotels", label: "Hotels & Stays", icon: Hotel },
  { id: "Rentals", label: "Rentals", icon: Car },
  { id: "Medical", label: "Medical & Care", icon: HeartPulse },
  { id: "Emergency", label: "Emergency & Safety", icon: ShieldAlert },
  { id: "Shopping", label: "Shopping", icon: ShoppingBag },
];

export function InteractiveSmartMap({
  destination,
  initialMarkers = [],
  center = { lat: 32.2432, lng: 77.1892 },
  onMarkerSelect,
}: InteractiveSmartMapProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>(initialMarkers);
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [showRoute, setShowRoute] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch real map markers & route calculation from API
  useEffect(() => {
    let isCancelled = false;
    async function loadMapData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/map?destination=${encodeURIComponent(destination)}&category=${encodeURIComponent(activeCategory)}&calculateRoute=true`
        );
        if (res.ok && !isCancelled) {
          const json = await res.json();
          if (json.success) {
            setMarkers(json.markers || []);
            if (json.routePlan) setRoutePlan(json.routePlan);
            if (json.markers?.length > 0 && !selectedMarker) {
              setSelectedMarker(json.markers[0]);
            }
          }
        }
      } catch (err) {
        console.warn("⚠️ Map API load error, using initial markers:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }

    loadMapData();
    return () => { isCancelled = true; };
  }, [destination, activeCategory]);

  const activeMarker = selectedMarker || markers[0];

  const handleSelectMarker = (m: MapMarker) => {
    setSelectedMarker(m);
    onMarkerSelect?.(m);
  };

  const handleCopyCoords = (coords: { lat: number; lng: number }) => {
    const text = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMarkerIcon = (cat: string) => {
    switch (cat) {
      case "Hotels": return <Hotel className="w-4 h-4 text-emerald-500" />;
      case "Food": return <Utensils className="w-4 h-4 text-orange-500" />;
      case "Rentals": return <Car className="w-4 h-4 text-blue-500" />;
      case "Medical": return <HeartPulse className="w-4 h-4 text-red-500" />;
      case "Emergency": return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case "Shopping": return <ShoppingBag className="w-4 h-4 text-purple-500" />;
      default: return <MapPin className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
                isActive
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                  : "bg-card text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Main Map Container */}
      <div className="relative w-full h-[600px] md:h-[680px] rounded-[2.5rem] overflow-hidden border border-border/60 shadow-2xl bg-card flex flex-col md:flex-row">
        
        {/* Left Side: Map Iframe / Pins Display */}
        <div className="flex-1 relative bg-zinc-950 overflow-hidden min-h-[350px]">
          {activeMarker ? (
            <iframe
              key={`${activeMarker.id}-${activeCategory}`}
              className="absolute inset-0 w-full h-full grayscale-[0.1] contrast-[1.05] dark:invert-[0.9] opacity-90 transition-all duration-700"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(activeMarker.name + " " + destination)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              title="Interactive Smart Map"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm font-medium">
              No places found in this category.
            </div>
          )}

          {/* Floating Category Indicator & Route Toggle */}
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <span className="px-4 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-[10px] font-black uppercase tracking-wider text-foreground shadow-lg flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-primary" /> {destination} Map ({markers.length} spots)
            </span>
            {routePlan && (
              <button
                onClick={() => setShowRoute(!showRoute)}
                className={`px-4 py-1.5 rounded-full backdrop-blur-md border text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all ${
                  showRoute ? "bg-primary text-white border-primary" : "bg-background/80 text-foreground border-border/50 hover:bg-muted"
                }`}
              >
                <Route className="w-3.5 h-3.5" /> {showRoute ? "Hide Route" : "Show Day Route"}
              </button>
            )}
          </div>

          {/* Map Overlay Route Summary Pill */}
          {showRoute && routePlan && (
            <div className="absolute bottom-6 left-6 right-6 md:right-auto z-20 bg-background/95 backdrop-blur-xl border border-border/60 p-4 rounded-2xl shadow-2xl max-w-md animate-in slide-in-from-bottom-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">
                Optimized Day Route Sequence
              </div>
              <div className="text-xs font-bold text-foreground flex items-center gap-3 mb-2">
                <span>{routePlan.metrics.totalDistanceKm} km total</span>
                <span>•</span>
                <span>🚗 {routePlan.metrics.formattedDriving} drive</span>
                <span>•</span>
                <span>🚶 {routePlan.metrics.formattedWalking} walk</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-[9px] font-bold text-muted-foreground">
                {routePlan.waypoints.map((w, i) => (
                  <span key={i} className="px-2 py-0.5 bg-muted rounded border shrink-0">
                    {i + 1}. {w.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Spot Detail & Marker Explorer List */}
        <div className="w-full md:w-[380px] lg:w-[420px] bg-card border-l border-border/50 flex flex-col h-full overflow-hidden">
          
          {/* Active Selected Spot Details */}
          {activeMarker && (
            <div className="p-6 border-b border-border/50 bg-muted/20 space-y-4 shrink-0">
              <div className="relative h-40 rounded-2xl overflow-hidden border border-border/40 bg-muted">
                <img
                  src={activeMarker.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop"}
                  alt={activeMarker.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase text-white tracking-wider flex items-center gap-1">
                  {getMarkerIcon(activeMarker.category)} {activeMarker.category}
                </div>
                {activeMarker.rating && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md">
                    <Star className="w-3 h-3 fill-current" /> {activeMarker.rating}
                  </div>
                )}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-lg font-black font-headline truncate leading-tight">{activeMarker.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-white/80 font-medium">
                    <span><Clock className="w-3 h-3 inline mr-1" />{activeMarker.openingHours || "Open Daily"}</span>
                    <span>•</span>
                    <span>{activeMarker.distance || "Near Center"}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-medium leading-relaxed line-clamp-2">
                {activeMarker.description}
              </p>

              {/* Actions: Google Maps, Apple Maps, Copy Coords */}
              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" className="flex-1 rounded-xl h-9 text-[10px] font-black uppercase" asChild>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeMarker.name + " " + destination)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="flex-1 rounded-xl h-9 text-[10px] font-black uppercase" asChild>
                  <a
                    href={`https://maps.apple.com/?q=${encodeURIComponent(activeMarker.name + " " + destination)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Apple Maps <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl h-9 w-9 p-0"
                  title="Copy Coordinates"
                  onClick={() => handleCopyCoords(activeMarker.coordinates)}
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>
          )}

          {/* Marker List Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2">
              Explore {activeCategory} ({markers.length})
            </div>
            {markers.map((m) => {
              const isSelected = m.id === activeMarker?.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleSelectMarker(m)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
                    isSelected
                      ? "bg-primary/10 border-primary text-foreground shadow-md"
                      : "bg-background border-border/40 hover:bg-muted/50 hover:border-border"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0 relative">
                    <img src={m.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=200&auto=format&fit=crop"} alt={m.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground mb-0.5">
                      <span>{m.subCategory || m.category}</span>
                      {m.rating && <span className="text-amber-500 flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-current" /> {m.rating}</span>}
                    </div>
                    <div className="text-xs font-bold text-foreground truncate">{m.name}</div>
                  </div>
                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? "text-primary translate-x-0.5" : "text-muted-foreground/40"}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
