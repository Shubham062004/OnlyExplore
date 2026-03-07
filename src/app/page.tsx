"use client";

import { DestinationSearch } from "@/components/DestinationSearch";
import { TrendingDestinations } from "@/components/TrendingDestinations";
import { PastTrips } from "@/components/PastTrips";
import { Sidebar } from "@/components/Sidebar";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <div className="flex w-full min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar 
        onSelectChat={(id) => { router.push(`/chat/${id}`); }} 
        onNewChat={() => { router.push('/chat'); }} 
      />
      <div className="flex-1 flex flex-col relative h-screen overflow-y-auto">
        
        {/* Hero Section */}
        <section className="relative w-full h-[50vh] min-h-[400px] flex flex-col items-center justify-center border-b border-border/50 bg-gradient-to-b from-primary/5 to-background">
          <DestinationSearch />
        </section>

        {/* Content Section */}
        <div className="w-full max-w-7xl mx-auto flex-1 pb-12">
          {/* Trending */}
          <TrendingDestinations />

          {/* Past Trips */}
          <PastTrips />
        </div>
        
      </div>
    </div>
  );
}
