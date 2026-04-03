"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
  Building, MapPin, CheckSquare, Sun, Thermometer,
  CloudLightning, Mountain, Users, Plane, Star, Map as MapIcon, Calendar
} from "lucide-react";

const getUnsplashImage = (seed: string, type: 'landscape'|'activity'|'hotel'|'vehicle') => {
  const query = `${seed} ${type} travel photography high quality`;
  // Using the user's requested source.unsplash.com pattern for dynamic results
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
};

export function DestinationSkeleton() {
  return (
    <div className="w-full flex-col space-y-8 pb-12">
      <Skeleton className="w-full h-[420px] bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <Skeleton className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="max-w-7xl mx-auto px-4 w-full">
        <Skeleton className="w-full h-[280px] rounded-2xl mt-8 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 mt-8">
        <Skeleton className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export function DestinationHero({ title, description, destination, image }: { title: string; description: string; destination: string; image?: string }) {
  const fallback = `https://source.unsplash.com/1600x900/?${encodeURIComponent(destination)},skyline`;
  
  return (
    <div className="relative w-full h-[420px] flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 z-10 rounded-b-2xl md:rounded-b-[3rem]" />
      <img
        src={image || fallback}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover rounded-b-2xl md:rounded-b-[3rem] -z-10"
        onError={(e) => {
          e.currentTarget.src = `https://images.unsplash.com/featured/1600x900/?travel,city,${encodeURIComponent(destination)}`;
        }}
      />
      
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto w-full flex flex-col items-center">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-headline mb-4 text-white drop-shadow-lg leading-tight uppercase">
          {title || `Explore ${destination}`}
        </h1>
        <p className="text-lg md:text-xl text-zinc-200 block max-w-2xl mx-auto drop-shadow-md font-medium">
          {description}
        </p>
      </div>
    </div>
  );
}

export function QuickFacts({ facts }: { facts: any }) {
  if (!facts) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 -mt-16 relative z-30">
      <div className="bg-card shadow-xl shadow-black/5 border border-border/50 rounded-2xl p-6 flex flex-col items-start hover:shadow-2xl transition-all">
        <Mountain className="w-6 h-6 text-indigo-500 mb-4" />
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Altitude</span>
        <span className="font-semibold text-lg text-foreground">{facts.altitude || 'N/A'}</span>
      </div>
      <div className="bg-card shadow-xl shadow-black/5 border border-border/50 rounded-2xl p-6 flex flex-col items-start hover:shadow-2xl transition-all">
        <Calendar className="w-6 h-6 text-orange-500 mb-4" />
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Best Time</span>
        <span className="font-semibold text-lg text-foreground">{facts.bestTime || 'N/A'}</span>
      </div>
      <div className="bg-card shadow-xl shadow-black/5 border border-border/50 rounded-2xl p-6 flex flex-col items-start hover:shadow-2xl transition-all">
        <Thermometer className="w-6 h-6 text-red-500 mb-4" />
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Avg Temp</span>
        <span className="font-semibold text-lg text-foreground">{facts.avgTemp || 'N/A'}</span>
      </div>
      <div className="bg-card shadow-xl shadow-black/5 border border-border/50 rounded-2xl p-6 flex flex-col items-start hover:shadow-2xl transition-all">
        <MapPin className="w-6 h-6 text-teal-500 mb-4" />
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Location</span>
        <span className="font-semibold text-lg text-foreground">{facts.location || 'N/A'}</span>
      </div>
    </div>
  );
}

export function InteractiveMap({ destination }: { destination: string }) {
  // Use Google Maps embed pointing dynamically to the destination
  const mapQuery = encodeURIComponent(`${destination} Tourist Attractions`);
  
  return (
    <div className="w-full mt-12 mb-12">
      <div className="flex justify-between items-end mb-4">
        <h3 className="text-2xl font-bold font-headline flex items-center gap-2">
          Location Map
        </h3>
        <Button variant="link" asChild className="text-primary font-medium hover:underline p-0 h-auto">
          <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer">
             Open Full Map <MapPin className="w-4 h-4 ml-1" />
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

export function PopularPlaces({ places, destination, images }: { places: any[]; destination: string; images?: string[] }) {
  if (!places || places.length === 0) return null;
  return (
    <div className="space-y-6 mt-12">
      <h3 className="text-2xl font-bold font-headline">Popular Places</h3>
      <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
        {places.map((place, idx) => (
          <div key={idx} className="min-w-[280px] md:min-w-0 snap-start group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-card border">
            <div className="relative h-48 w-full">
              <img 
                src={images?.[idx] || getUnsplashImage(place.name, 'landscape')} 
                alt={place.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                onError={(e) => {
                   e.currentTarget.src = `https://images.unsplash.com/featured/800x450/?travel,${encodeURIComponent(place.name)}`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <Button size="icon" variant="secondary" className="absolute top-3 right-3 w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-black border-none ring-1 ring-white/20">
                <MapIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-5 absolute bottom-0 left-0 right-0 text-white">
              <h4 className="font-bold text-lg mb-1 drop-shadow-md leading-tight">{place.name}</h4>
              <p className="text-xs text-zinc-200 line-clamp-2 drop-shadow-md font-medium">{place.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TripPlannerCTA({ destination }: { destination: string }) {
  const router = useRouter();
  return (
    <div className="w-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2rem] p-8 md:p-12 text-white shadow-xl mt-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl mix-blend-overlay" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/10 rounded-full blur-3xl mix-blend-overlay" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-white/30">
            <SparklesIcon className="w-3 h-3" /> AI Planner Pro
          </div>
          <h3 className="text-3xl md:text-5xl font-bold font-headline mb-4 leading-tight">Plan your perfect trip in seconds</h3>
          <p className="text-blue-100 text-lg md:text-xl max-w-xl">
            Our AI crafts personalized daily itineraries based on your interests, budget, and travel style.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button size="lg" onClick={() => router.push(`/chat?destination=${encodeURIComponent(destination)}`)} className="bg-white text-blue-600 hover:bg-zinc-100 font-bold px-8 h-12 text-base rounded-full shadow-lg">
              Generate a Trip
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-8 h-12 text-base bg-transparent rounded-full backdrop-blur-sm">
              See Sample Plan
            </Button>
          </div>
        </div>
        
        {/* Mock Chat Interface right side */}
        <div className="hidden lg:flex flex-col w-[320px] bg-white text-black p-4 rounded-2xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 border border-border">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">Trip Assistant</p>
              <p className="text-[10px] text-muted-foreground font-medium">Online Ready</p>
            </div>
          </div>
          <div className="bg-muted p-3 rounded-xl rounded-tl-none text-sm mb-3">
            Hey! Planning a 5-day adventure near Manali?
          </div>
          <div className="bg-blue-500 text-white p-3 rounded-xl rounded-tr-none text-sm self-end mb-3 ml-8 shadow-sm">
            Yes, including paragliding and river rafting!
          </div>
          <div className="bg-muted p-3 rounded-xl rounded-tl-none text-sm">
            Got it. I've added Solang and Beas River to day 2.
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    </svg>
  );
}

export function AdventureActivities({ activities, images }: { activities: any[]; images?: string[] }) {
  if (!activities || activities.length === 0) return null;
  return (
    <div className="space-y-6 mt-16">
      <h3 className="text-2xl font-bold font-headline">Adventure Activities</h3>
      <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
        {activities.map((act, idx) => (
          <div key={idx} className="min-w-[280px] md:min-w-0 snap-start group relative overflow-hidden rounded-2xl shadow-sm bg-card border">
            <div className="relative h-48 w-full">
              <img 
                src={images?.[idx] || getUnsplashImage(act.name, 'activity')} 
                alt={act.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                onError={(e) => {
                   e.currentTarget.src = `https://images.unsplash.com/featured/800x450/?adventure,${encodeURIComponent(act.name)}`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute top-3 left-3 bg-indigo-500/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                 {act.bestSeason || 'Year-round'}
              </div>
            </div>
            <div className="absolute bottom-0 left-0 p-4 text-white">
              <h4 className="font-bold text-lg leading-tight">{act.name}</h4>
              <p className="text-xs text-indigo-200 font-semibold">{act.cost ? `Starts at ${act.cost}` : act.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StayRecommendations({ hotels, images }: { hotels: any[]; images?: string[] }) {
  if (!hotels || hotels.length === 0) return null;
  return (
    <div className="space-y-6 mt-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <h3 className="text-2xl font-bold font-headline">Where to Stay</h3>
         <div className="flex bg-muted p-1 rounded-full border">
            <Button variant="ghost" size="sm" className="rounded-full bg-primary text-primary-foreground shadow-sm">All Hotels</Button>
            <Button variant="ghost" size="sm" className="rounded-full">Luxury</Button>
            <Button variant="ghost" size="sm" className="rounded-full">Mid-range</Button>
            <Button variant="ghost" size="sm" className="rounded-full">Budget</Button>
         </div>
      </div>
      <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible">
        {hotels.map((hotel, idx) => (
          <div key={idx} className="min-w-[280px] md:min-w-0 snap-start bg-card border rounded-2xl overflow-hidden hover:shadow-xl transition-all shadow-sm flex flex-col">
            <div className="relative h-48 w-full">
              <img 
                src={images?.[idx] || getUnsplashImage(hotel.name, 'hotel')} 
                alt={hotel.name} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                   e.currentTarget.src = `https://images.unsplash.com/featured/800x450/?hotel,luxury,${encodeURIComponent(hotel.name)}`;
                }}
              />
              <div className="absolute top-3 left-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">
                {hotel.type}
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                 <div className="flex justify-between items-start mb-2">
                   <h4 className="font-bold text-lg leading-tight w-4/5">{hotel.name}</h4>
                   <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold px-1.5 py-0.5 rounded flex items-center">
                     ★ {4.6 + (idx * 0.1)}
                   </div>
                 </div>
                 <p className="text-sm text-muted-foreground line-clamp-1 mb-4 font-medium">Top rated verified stay.</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                 <div>
                   <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Est. Price</span>
                   <p className="font-bold text-lg">₹{(idx + 2) * 2100}</p>
                 </div>
                 <Button size="sm" className="rounded-full font-bold px-6 shadow-sm">Book</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RentalsSection({ rentals }: { rentals: any[] }) {
  if (!rentals || rentals.length === 0) return null;
  return (
    <div className="space-y-6 mt-16">
      <h3 className="text-2xl font-bold font-headline">Rentals</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {rentals.map((rental, idx) => (
          <div key={idx} className="bg-card border rounded-2xl p-5 text-center shadow-sm hover:shadow-lg transition-all flex flex-col items-center">
             <div className="w-24 h-24 relative mb-4 rounded-full overflow-hidden border-4 border-muted">
                <img 
                  src={getUnsplashImage(rental.type, 'vehicle')} 
                  alt={rental.type} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.src = `https://images.unsplash.com/featured/400x400/?vehicle,${encodeURIComponent(rental.type)}`;
                  }}
                />
             </div>
             <h4 className="font-bold mb-1">{rental.type}</h4>
             <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">{rental.cost}/day</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NearbyDestinations({ nearby, images }: { nearby: any[]; images?: string[] }) {
  if (!nearby || nearby.length === 0) return null;
  return (
    <div className="space-y-6 mt-16">
      <h3 className="text-2xl font-bold font-headline">Nearby Destinations</h3>
      <div className="flex overflow-x-auto pb-4 gap-6 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
        {nearby.map((place, idx) => (
          <div key={idx} className="min-w-[200px] md:min-w-0 snap-start group relative overflow-hidden rounded-xl shadow-sm bg-card border">
            <div className="relative h-32 w-full">
              <img 
                src={images?.[idx] || getUnsplashImage(place.name, 'landscape')} 
                alt={place.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                onError={(e) => {
                   e.currentTarget.src = `https://images.unsplash.com/featured/800x450/?city,${encodeURIComponent(place.name)}`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 p-3 text-white">
              <h4 className="font-bold text-sm leading-tight">{place.name}</h4>
              {place.distance && <p className="text-[10px] text-zinc-300">Approx {place.distance}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TravelTips({ tips }: { tips: string[] }) {
  if (!tips || tips.length === 0) return null;
  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm h-full">
      <h3 className="text-xl font-bold font-headline mb-6 flex items-center gap-2">
        <MapPin className="w-5 h-5 text-blue-500" /> Travel Tips
      </h3>
      <div className="space-y-4">
        {tips.map((tip, idx) => (
          <div key={idx} className="flex gap-4 items-start">
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

export function PackingGuide({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm h-full">
      <h3 className="text-xl font-bold font-headline mb-6 flex items-center gap-2">
        <Building className="w-5 h-5 text-emerald-500 text-transparent fill-emerald-500" /> Packing Guide
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50">
            <div className="w-5 h-5 rounded border-2 border-emerald-500 flex items-center justify-center bg-emerald-500/10">
               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <span className="text-sm font-semibold">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
