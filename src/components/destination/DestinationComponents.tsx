"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Building, MapPin, Thermometer, Mountain, Users,
  Star, Map as MapIcon, Calendar, Zap, Hotel,
  ChevronRight, Clock, Tag,
} from "lucide-react";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop";

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
export function DestinationSkeleton() {
  return (
    <div className="w-full flex-col space-y-8 pb-12">
      <Skeleton className="w-full h-[420px] bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="max-w-7xl mx-auto px-4 w-full">
        <Skeleton className="w-full h-[280px] rounded-2xl mt-8 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 mt-8">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Facts
// ─────────────────────────────────────────────────────────────────────────────
export function QuickFacts({ facts }: { facts: any }) {
  if (!facts) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-16 relative z-30">
      {[
        { icon: <Mountain className="w-5 h-5 text-indigo-500" />, label: "Altitude", value: facts.altitude },
        { icon: <Calendar className="w-5 h-5 text-orange-500" />, label: "Best Time", value: facts.bestTime },
        { icon: <Thermometer className="w-5 h-5 text-red-500" />, label: "Avg Temp", value: facts.avgTemp },
        { icon: <MapPin className="w-5 h-5 text-teal-500" />, label: "Location", value: facts.location },
      ].map((f, i) => (
        <div key={i} className="bg-card shadow-xl shadow-black/5 border border-border/50 rounded-2xl p-5 flex flex-col items-start hover:shadow-2xl transition-all">
          <div className="mb-3">{f.icon}</div>
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">{f.label}</span>
          <span className="font-semibold text-base text-foreground">{f.value || "N/A"}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Interactive Map (Premium)
// ─────────────────────────────────────────────────────────────────────────────
export function InteractiveMap({ destination }: { destination: string }) {
  const mapQuery = encodeURIComponent(`${destination} Tourist Attractions`);
  return (
    <div className="w-full mt-12 mb-12">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-2xl font-bold font-headline flex items-center gap-2">
          <MapIcon className="w-6 h-6 text-primary" /> Location Map
        </h3>
        <Button variant="link" asChild className="text-primary font-medium hover:underline p-0 h-auto">
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer">
            Open Full Map <ChevronRight className="w-4 h-4 ml-1" />
          </a>
        </Button>
      </div>
      <div className="relative w-full h-[280px] rounded-3xl overflow-hidden border shadow-inner bg-muted">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
          title={`${destination} Map`}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Popular Places — each card uses its own specific image
// ─────────────────────────────────────────────────────────────────────────────
export function PopularPlaces({
  places,
  destination,
  onPlaceClick,
}: {
  places: any[];
  destination: string;
  onPlaceClick?: (place: any) => void;
}) {
  if (!places || places.length === 0) return null;
  return (
    <div className="space-y-6 mt-14">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-bold font-headline">Popular Places</h3>
          <p className="text-muted-foreground text-sm mt-1">Click any place to explore details & images</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {places.map((place, idx) => (
          <div
            key={idx}
            onClick={() => onPlaceClick?.(place)}
            role="button"
            tabIndex={0}
            aria-label={`Explore ${place.name}`}
            onKeyDown={(e) => { if (e.key === "Enter") onPlaceClick?.(place); }}
            className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 bg-card border border-border/50 h-64"
          >
            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={place.image || FALLBACK_IMAGE}
              alt={place.name}
              loading="lazy"
              onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

            {/* Tags */}
            {place.bestFor && place.bestFor.length > 0 && (
              <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                {(place.bestFor as string[]).slice(0, 2).map((tag: string, i: number) => (
                  <span key={i} className="text-[10px] font-bold bg-black/40 backdrop-blur-sm text-white px-2 py-0.5 rounded-full border border-white/20">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Tap hint */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Tap to Explore
              </span>
            </div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h4 className="font-bold text-lg leading-tight drop-shadow-md">{place.name}</h4>
              <p className="text-xs text-zinc-300 line-clamp-2 mt-0.5 font-medium">{place.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  destination,
}: {
  activities: any[];
  destination: string;
}) {
  const router = useRouter();
  if (!activities || activities.length === 0) return null;

  return (
    <div className="space-y-6 mt-16">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-2xl font-bold font-headline">Activities & Experiences</h3>
          <p className="text-muted-foreground text-sm mt-1">Hand-picked adventures in {destination}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-semibold hidden sm:flex"
          onClick={() => router.push(`/chat?destination=${encodeURIComponent(destination)}&prompt=activities`)}
        >
          Explore All <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {activities.map((act, idx) => (
          <div key={idx} className="group relative overflow-hidden rounded-2xl shadow-sm bg-card border hover:shadow-xl transition-all duration-300 flex flex-col">
            <div className="relative h-44 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={act.image || FALLBACK_IMAGE}
                alt={act.name}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              {act.bestSeason && (
                <span className="absolute top-3 left-3 text-[10px] font-bold bg-indigo-500/90 backdrop-blur-sm text-white px-2 py-1 rounded-full uppercase tracking-wider">
                  {act.bestSeason}
                </span>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-base leading-tight mb-1">{act.name}</h4>
                {act.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" /> {act.location}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-border/50">
                {act.price ? (
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">From</span>
                    <p className="font-bold text-base text-primary">{act.price}</p>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground font-medium">Free</span>
                )}
                <Button
                  size="sm"
                  className="rounded-full font-bold px-4 text-xs"
                  onClick={() => router.push(`/chat?destination=${encodeURIComponent(destination)}&prompt=${encodeURIComponent(`Book ${act.name}`)}`)}
                >
                  Book Now
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
    <div className="space-y-6 mt-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold font-headline">Where to Stay</h3>
          <p className="text-muted-foreground text-sm mt-1">Top-rated stays in {destination}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-semibold hidden sm:flex"
          onClick={() => router.push(`/chat?destination=${encodeURIComponent(destination)}&prompt=hotels`)}
        >
          View All Hotels <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {hotels.map((hotel, idx) => (
          <div key={idx} className="bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all shadow-sm flex flex-col">
            <div className="relative h-44 w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hotel.image || FALLBACK_IMAGE}
                alt={hotel.name}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute top-3 left-3 text-[10px] font-bold bg-blue-500/90 text-white px-2 py-1 rounded-full uppercase tracking-wider">
                {hotel.type}
              </span>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h4 className="font-bold text-sm leading-tight">{hotel.name}</h4>
                  {hotel.rating && (
                    <div className="flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {hotel.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-2">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Per Night</span>
                  <p className="font-bold text-base">{hotel.price || "On request"}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full font-bold px-4 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => router.push(`/chat?destination=${encodeURIComponent(destination)}&prompt=${encodeURIComponent(`Book ${hotel.name}`)}`)}
                >
                  View Deal
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
export function ItinerarySection({ itinerary, destination }: { itinerary: any[]; destination: string }) {
  if (!itinerary || itinerary.length === 0) return null;
  return (
    <div className="space-y-6 mt-16">
      <div>
        <h3 className="text-2xl font-bold font-headline">Suggested Itinerary</h3>
        <p className="text-muted-foreground text-sm mt-1">A day-by-day journey through {destination}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {itinerary.map((day, idx) => (
          <div
            key={idx}
            className="bg-card border rounded-2xl p-5 hover:shadow-lg transition-all shadow-sm relative overflow-hidden group"
          >
            {/* Day badge */}
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg mb-4">
              {day.day}
            </div>
            {/* Accent line */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary/60 to-transparent rounded-l-2xl" />

            <h4 className="font-bold text-base mb-3 leading-tight">{day.title}</h4>
            <div className="space-y-2">
              {(day.places as string[]).map((place: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <span className="font-medium">{place}</span>
                </div>
              ))}
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
    <div className="space-y-6 mt-16">
      <h3 className="text-2xl font-bold font-headline">Nearby Destinations</h3>
      <div className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
        {nearby.map((place, idx) => (
          <div key={idx} className="min-w-[180px] md:min-w-0 snap-start bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all shadow-sm">
            <div className="h-28 relative overflow-hidden bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://images.unsplash.com/featured/800x450/?${encodeURIComponent(place.name)},travel,landscape`}
                alt={place.name}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            </div>
            <div className="p-3">
              <h4 className="font-bold text-sm">{place.name}</h4>
              {place.distance && (
                <p className="text-xs text-muted-foreground mt-0.5">≈ {place.distance}</p>
              )}
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
    <div className="bg-card border rounded-2xl p-6 shadow-sm h-full">
      <h3 className="text-xl font-bold font-headline mb-5 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-500" /> Travel Tips
      </h3>
      <div className="space-y-3">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex gap-3 items-start">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold mt-0.5">
              {idx + 1}
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed font-medium">{tip}</p>
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
    <div className="bg-card border rounded-2xl p-6 shadow-sm h-full">
      <h3 className="text-xl font-bold font-headline mb-5 flex items-center gap-2">
        <Building className="w-5 h-5 text-emerald-500" /> Packing Guide
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-xl border border-border/50">
            <div className="w-5 h-5 rounded border-2 border-emerald-500 flex items-center justify-center bg-emerald-500/10 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 6 9 17l-5-5" /></svg>
            </div>
            <span className="text-xs font-semibold">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
