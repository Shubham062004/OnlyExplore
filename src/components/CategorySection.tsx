"use client";

import { DestinationCard } from "./DestinationCard";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Destination {
  name: string;
  image: string;
}

interface Category {
  name: string;
  bestFor: string[];
  destinations: Destination[];
}

interface CategorySectionProps {
  category: Category;
}

export function CategorySection({ category }: CategorySectionProps) {
  return (
    <div className="w-full mt-12 px-4 pb-8 border-b border-border/40 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          {/* <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-accent/80">
              Collection
            </span>
          </div> */}
          <h2 className="text-3xl md:text-4xl font-bold font-headline mb-2 text-foreground">
            {category.name}
          </h2>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground mr-1">Best for:</span>
            {category.bestFor.map((tag, idx) => (
              <span 
                key={idx}
                className="text-[10px] sm:text-xs bg-primary/10 text-primary-foreground font-bold px-2.5 py-1 rounded-full border border-primary/20 backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        
        <Button variant="ghost" className="hidden sm:flex items-center gap-2 text-primary font-bold hover:bg-primary/5">
          View all <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div 
        className="flex overflow-x-auto gap-4 sm:gap-6 pb-4 px-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden outline-none"
        tabIndex={-1}
      >
        {category.destinations.map((dest, i) => (
          <div key={i} className="snap-start shrink-0 p-1 pt-4">
            <DestinationCard name={dest.name} image={dest.image} />
          </div>
        ))}
      </div>
    </div>
  );
}
