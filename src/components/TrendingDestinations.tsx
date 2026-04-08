"use client";

import { DestinationCard } from "./DestinationCard";
import { Sparkles } from "lucide-react";

const regions = [
  {
    name: "North India",
    destinations: [
      { name: "New Delhi", image: "https://source.unsplash.com/800x600/?delhi,india-gate" },
      { name: "Lucknow", image: "https://source.unsplash.com/800x600/?lucknow,monument" },
      { name: "Amritsar", image: "https://source.unsplash.com/800x600/?amritsar,temple" },
      { name: "Varanasi", image: "https://source.unsplash.com/800x600/?varanasi,ghats" },
      { name: "Shimla", image: "https://source.unsplash.com/800x600/?shimla,hills" },
      { name: "Srinagar", image: "https://source.unsplash.com/800x600/?srinagar,lake" },
      { name: "Chandigarh", image: "https://source.unsplash.com/800x600/?chandigarh,architecture" },
      { name: "Dehradun", image: "https://source.unsplash.com/800x600/?dehradun,city" },
      { name: "Leh", image: "https://source.unsplash.com/800x600/?leh,ladakh" },
      { name: "Jammu", image: "https://source.unsplash.com/800x600/?jammu,city" },
    ]
  },
  {
    name: "South India",
    destinations: [
      { name: "Bengaluru", image: "https://source.unsplash.com/800x600/?bangalore,city" },
      { name: "Chennai", image: "https://source.unsplash.com/800x600/?chennai,beach" },
      { name: "Hyderabad", image: "https://source.unsplash.com/800x600/?hyderabad,charminar" },
      { name: "Kochi", image: "https://source.unsplash.com/800x600/?kochi,backwaters" },
      { name: "Thiruvananthapuram", image: "https://source.unsplash.com/800x600/?trivandrum,temple" },
      { name: "Mysore", image: "https://source.unsplash.com/800x600/?mysore,palace" },
      { name: "Visakhapatnam", image: "https://source.unsplash.com/800x600/?vizag,beach" },
      { name: "Puducherry", image: "https://source.unsplash.com/800x600/?puducherry,street" },
      { name: "Madurai", image: "https://source.unsplash.com/800x600/?madurai,temple" },
      { name: "Vijayawada", image: "https://source.unsplash.com/800x600/?vijayawada,river" },
    ]
  },
  {
    name: "West & Central India",
    destinations: [
      { name: "Mumbai", image: "https://source.unsplash.com/800x600/?mumbai,skyline" },
      { name: "Jaipur", image: "https://source.unsplash.com/800x600/?jaipur,fort" },
      { name: "Ahmedabad", image: "https://source.unsplash.com/800x600/?ahmedabad,riverfront" },
      { name: "Panaji", image: "https://source.unsplash.com/800x600/?goa,panaji" },
      { name: "Bhopal", image: "https://source.unsplash.com/800x600/?bhopal,lake" },
      { name: "Indore", image: "https://source.unsplash.com/800x600/?indore,temple" },
      { name: "Pune", image: "https://source.unsplash.com/800x600/?pune,city" },
      { name: "Udaipur", image: "https://source.unsplash.com/800x600/?udaipur,lake" },
      { name: "Raipur", image: "https://source.unsplash.com/800x600/?raipur,city" },
      { name: "Surat", image: "https://source.unsplash.com/800x600/?surat,city" },
    ]
  },
  {
    name: "East & North East India",
    destinations: [
      { name: "Kolkata", image: "https://source.unsplash.com/800x600/?kolkata,victoria-memorial" },
      { name: "Bhubaneswar", image: "https://source.unsplash.com/800x600/?bhubaneswar,temple" },
      { name: "Guwahati", image: "https://source.unsplash.com/800x600/?guwahati,river" },
      { name: "Patna", image: "https://source.unsplash.com/800x600/?patna,city" },
      { name: "Ranchi", image: "https://source.unsplash.com/800x600/?ranchi,waterfall" },
      { name: "Gangtok", image: "https://source.unsplash.com/800x600/?gangtok,mountain" },
      { name: "Shillong", image: "https://source.unsplash.com/800x600/?shillong,nature" },
      { name: "Imphal", image: "https://source.unsplash.com/800x600/?imphal,city" },
      { name: "Kohima", image: "https://source.unsplash.com/800x600/?kohima,hills" },
      { name: "Agartala", image: "https://source.unsplash.com/800x600/?agartala,palace" },
      { name: "Aizawl", image: "https://source.unsplash.com/800x600/?aizawl,city" },
      { name: "Itanagar", image: "https://source.unsplash.com/800x600/?itanagar,monastery" },
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
