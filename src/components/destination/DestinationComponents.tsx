"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { 
  Building, Map, MapPin, CheckSquare, Coffee, Sun, Thermometer,
  CloudLightning, Mountain, Users, Plane, Star, Banknote
} from "lucide-react";
import { formatCurrencyDisplay } from "@/lib/currency";

export function SkeletonLoader() {
  return (
    <div className="w-full flex-col space-y-8 p-4">
      <Skeleton className="w-full h-80 rounded-2xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="col-span-2 h-96 rounded-xl" />
        <Skeleton className="col-span-1 h-96 rounded-xl" />
      </div>
    </div>
  );
}

export function TripPlannerCTA({ destination }: { destination: string }) {
  const router = useRouter();

  const handlePlanTrip = () => {
    // Navigate straight to chat interface, bypassing homepage wrapper
    router.push(`/chat?destination=${encodeURIComponent(destination)}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-primary/10 border border-primary/20 rounded-2xl p-6 sm:p-10 text-center my-8">
      <h3 className="text-2xl md:text-3xl font-bold font-headline mb-4">Plan your perfect trip in seconds</h3>
      <p className="text-muted-foreground mb-6">
        Go through all these details and plan your journey accordingly. 
        Answer a few questions to generate your personalized AI travel plan.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" onClick={handlePlanTrip} className="font-semibold px-8 hover:scale-105 transition-transform">
          Generate Trip
        </Button>
      </div>
    </div>
  );
}

export function DestinationHero({ title, description, destination }: { title: string; description: string; destination: string }) {
  const fallbackImg = `https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=1920`;
  
  return (
    <div className="relative w-full h-[50vh] min-h-[400px] flex items-center justify-center overflow-hidden">
      <img 
        src={fallbackImg}
        onError={(e) => { e.currentTarget.src = 'https://placehold.co/1920x800/png?text=' + destination }}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto text-white">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-headline mb-4 drop-shadow-lg">
          {title || `Explore ${destination}`}
        </h1>
        <p className="text-lg md:text-xl text-zinc-200 mb-8 max-w-2xl mx-auto drop-shadow">
          {description}
        </p>
      </div>
    </div>
  );
}

export function QuickFacts({ facts }: { facts: any }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 -mt-12 relative z-20 max-w-7xl mx-auto px-4">
      <div className="bg-card shadow-lg border rounded-xl p-4 flex flex-col items-center text-center">
        <Mountain className="w-6 h-6 text-indigo-500 mb-2" />
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Altitude</span>
        <span className="font-semibold text-lg">{facts?.altitude || 'N/A'}</span>
      </div>
      <div className="bg-card shadow-lg border rounded-xl p-4 flex flex-col items-center text-center">
        <Sun className="w-6 h-6 text-orange-500 mb-2" />
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Best Time</span>
        <span className="font-semibold text-lg">{facts?.bestTime || 'N/A'}</span>
      </div>
      <div className="bg-card shadow-lg border rounded-xl p-4 flex flex-col items-center text-center">
        <Thermometer className="w-6 h-6 text-red-500 mb-2" />
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Avg Temp</span>
        <span className="font-semibold text-lg">{facts?.avgTemp || 'N/A'}</span>
      </div>
      <div className="bg-card shadow-lg border rounded-xl p-4 flex flex-col items-center text-center">
        <MapPin className="w-6 h-6 text-teal-500 mb-2" />
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Location</span>
        <span className="font-semibold text-lg">{facts?.location || 'N/A'}</span>
      </div>
    </div>
  );
}

export function PopularPlaces({ places, destination }: { places: any[]; destination: string }) {
  if (!places || places.length === 0) return null;
  
  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2">
        <MapPin className="text-accent w-6 h-6" /> Must Visit Places
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {places.map((place, idx) => (
          <div key={idx} className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow">
            <h4 className="font-semibold text-lg mb-1">{place.name}</h4>
            <p className="text-sm text-muted-foreground">{place.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdventureActivities({ activities }: { activities: any[] }) {
  if (!activities || activities.length === 0) return null;

  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm overflow-hidden">
      <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
        <CloudLightning className="text-orange-500 w-5 h-5" /> Adventure & Activities
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Activity</th>
              <th className="px-4 py-3 hidden sm:table-cell">Location</th>
              <th className="px-4 py-3 hidden md:table-cell">Best Season</th>
              <th className="px-4 py-3 rounded-tr-lg">Cost Estimate</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((act, idx) => (
               <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                 <td className="px-4 py-3 font-semibold">{act.name}</td>
                 <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">{act.location || '-'}</td>
                 <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{act.bestSeason || '-'}</td>
                 <td className="px-4 py-3 text-emerald-600 font-medium">{act.cost || '-'}</td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StayRecommendations({ hotels }: { hotels: any[] }) {
  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm">
      <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
        <Building className="text-indigo-500 w-5 h-5" /> Where to Stay
      </h3>
      <div className="space-y-4">
        {hotels.map((hotel, idx) => (
          <div key={idx} className="flex justify-between items-center border-b last:border-0 pb-3 last:pb-0">
            <div>
              <p className="font-semibold">{hotel.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{hotel.type}</p>
            </div>
            <Star className="text-yellow-400 w-4 h-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function RentalsSection({ rentals }: { rentals: any[] }) {
  if (!rentals || rentals.length === 0) return null;

  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm">
      <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
        <Map className="text-teal-500 w-5 h-5" /> Getting Around
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rentals.map((rental, idx) => (
          <div key={idx} className="bg-muted/30 p-3 rounded-lg border flex justify-between items-center">
            <span className="font-medium text-sm">{rental.type}</span>
            <span className="font-semibold text-emerald-600 text-sm">{rental.cost}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NearbyDestinations({ nearby }: { nearby: any[] }) {
  if (!nearby || nearby.length === 0) return null;

  return (
    <div className="bg-card border rounded-xl p-5 shadow-sm">
      <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-2">
        <Plane className="text-sky-500 w-5 h-5" /> Nearby Places
      </h3>
      <div className="flex flex-wrap gap-2">
        {nearby.map((place, idx) => (
          <div key={idx} className="bg-background border rounded-full px-4 py-1.5 text-sm flex items-center gap-2">
            <span className="font-medium">{place.name}</span>
            {place.distance && <span className="text-muted-foreground text-xs opacity-75">({place.distance})</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function TravelTips({ tips }: { tips: string[] }) {
  if (!tips || tips.length === 0) return null;

  return (
    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-5 shadow-sm">
      <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Users className="w-5 h-5" /> Travel Tips
      </h3>
      <ul className="space-y-2">
        {tips.map((tip, idx) => (
          <li key={idx} className="flex gap-2 text-sm items-start">
            <div className="min-w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
            <span className="text-muted-foreground">{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PackingGuide({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 shadow-sm">
      <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
        <CheckSquare className="w-5 h-5" /> Packing Guide
      </h3>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex flex-row items-center gap-2 text-sm">
            <CheckSquare className="w-4 h-4 text-emerald-500/50" />
            <span className="font-medium text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
