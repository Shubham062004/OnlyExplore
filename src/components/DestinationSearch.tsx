"use client";

import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function DestinationSearch() {
  const [destination, setDestination] = useState("");
  const router = useRouter();

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (destination.trim()) {
      router.push(`/destination/${encodeURIComponent(destination.trim())}`);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <h1 className="text-4xl md:text-6xl font-headline font-bold text-center text-foreground mb-8">
        Where to?
      </h1>
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 p-2 bg-background border rounded-full shadow-lg shadow-primary/5 hover:shadow-xl transition-shadow duration-300 backdrop-blur-md"
      >
        <div className="flex-1 flex items-center pl-4 bg-transparent">
          <MapPin className="w-5 h-5 text-muted-foreground mr-2 shrink-0" />
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Search destination"
            className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-10 text-base md:text-lg bg-transparent focus:ring-0 focus:ring-offset-0 outline-none"
          />
        </div>
        <Button
          type="submit"
          className="rounded-full px-6 py-6 font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Search className="w-5 h-5 md:mr-2" />
          <span className="hidden md:inline">Get Started</span>
        </Button>
      </form>
    </div>
  );
}
