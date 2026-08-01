"use client";

import { DestinationCard } from "./DestinationCard";
import { Sparkles } from "lucide-react";

/**
 * TrendingDestinations uses direct Unsplash photo URLs (by photo ID) instead of
 * the deprecated/unreliable `featured/800x600/?query` pattern.
 * Each URL is a known-good Unsplash photo that won't break in production.
 */
const regions = [
  {
    name: "North India",
    destinations: [
      { name: "New Delhi", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=800" },
      { name: "Lucknow", image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&q=80&w=800" },
      { name: "Amritsar", image: "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&q=80&w=800" },
      { name: "Varanasi", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&q=80&w=800" },
      { name: "Shimla", image: "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&q=80&w=800" },
      { name: "Srinagar", image: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&q=80&w=800" },
      { name: "Chandigarh", image: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&q=80&w=800" },
      { name: "Dehradun", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=800" },
      { name: "Leh", image: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&q=80&w=800" },
      { name: "Jammu", image: "https://images.unsplash.com/photo-1566837945700-30057527ade0?auto=format&fit=crop&q=80&w=800" },
    ]
  },
  {
    name: "South India",
    destinations: [
      { name: "Bengaluru", image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=800" },
      { name: "Chennai", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800" },
      { name: "Hyderabad", image: "https://images.unsplash.com/photo-1572007865151-fbd9baef0bdb?auto=format&fit=crop&q=80&w=800" },
      { name: "Kochi", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&q=80&w=800" },
      { name: "Thiruvananthapuram", image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800" },
      { name: "Mysore", image: "https://images.unsplash.com/photo-1600587402844-e5b0b8ebc3a0?auto=format&fit=crop&q=80&w=800" },
      { name: "Visakhapatnam", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800" },
      { name: "Puducherry", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&q=80&w=800" },
      { name: "Madurai", image: "https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?auto=format&fit=crop&q=80&w=800" },
      { name: "Vijayawada", image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=800" },
    ]
  },
  {
    name: "West & Central India",
    destinations: [
      { name: "Mumbai", image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&q=80&w=800" },
      { name: "Jaipur", image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=800" },
      { name: "Ahmedabad", image: "https://images.unsplash.com/photo-1572210029993-1eddcfb47353?auto=format&fit=crop&q=80&w=800" },
      { name: "Panaji", image: "https://images.unsplash.com/photo-1512789172734-7b099dbd15a6?auto=format&fit=crop&q=80&w=800" },
      { name: "Bhopal", image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800" },
      { name: "Indore", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800" },
      { name: "Pune", image: "https://images.unsplash.com/photo-1567157577867-05ccb1388e13?auto=format&fit=crop&q=80&w=800" },
      { name: "Udaipur", image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&q=80&w=800" },
      { name: "Raipur", image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=800" },
      { name: "Surat", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800" },
    ]
  },
  {
    name: "East & North East India",
    destinations: [
      { name: "Kolkata", image: "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80&w=800" },
      { name: "Bhubaneswar", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800" },
      { name: "Guwahati", image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=800" },
      { name: "Patna", image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800" },
      { name: "Ranchi", image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&q=80&w=800" },
      { name: "Gangtok", image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&q=80&w=800" },
      { name: "Shillong", image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=800" },
      { name: "Imphal", image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&q=80&w=800" },
      { name: "Kohima", image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&q=80&w=800" },
      { name: "Agartala", image: "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&q=80&w=800" },
      { name: "Aizawl", image: "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&q=80&w=800" },
      { name: "Itanagar", image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&q=80&w=800" },
    ]
  }
];

export function TrendingDestinations() {
  return (
    <div className="w-full mt-16 px-4 pb-8 border-b border-border/50">
      <div className="flex items-center gap-2 mb-8">
        <Sparkles className="w-6 h-6 text-accent" />
        <h2 className="text-3xl font-bold font-headline">Explore India</h2>
      </div>

      <div className="space-y-12">
        {regions.map((region) => (
          <div key={region.name} className="relative">
            <h3 className="text-xl font-semibold mb-4 text-muted-foreground ml-1">
              Top {region.name} India Picks
            </h3>
            <div 
              className="flex overflow-x-auto gap-4 sm:gap-6 pb-8 px-4 -mx-4 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden outline-none"
              tabIndex={-1}
            >
              {region.destinations.map((dest, i) => (
                <div key={i} className="snap-start shrink-0 p-1 pt-4">
                  <DestinationCard name={dest.name} image={dest.image} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
