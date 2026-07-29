"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, MapPin, CalendarDays, Compass, Loader2, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripCard, TripData } from "@/components/ui/TripCard";
import { Sidebar } from "@/components/Sidebar";
import { useRouter } from "next/navigation";

const STATUS_TABS = ["All", "Upcoming", "Planning", "Draft", "Completed", "Cancelled"];

export default function MyTripsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trips?status=${encodeURIComponent(activeTab)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setTrips(json.data || []);
        }
      }
    } catch (err) {
      console.warn("⚠️ Failed to fetch trips:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [activeTab]);

  const handleCreateNewTrip = async () => {
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination: "Manali",
          title: "New Himachal Adventure",
          status: "Draft",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          fetchTrips();
        }
      }
    } catch (err) {
      console.warn("⚠️ Create trip failed:", err);
    }
  };

  const handleDeleteTrip = async (trip: TripData) => {
    if (!confirm(`Are you sure you want to delete "${trip.title || trip.destination}"?`)) return;
    try {
      await fetch(`/api/trips/${trip._id}`, { method: "DELETE" });
      fetchTrips();
    } catch (err) {
      console.warn("⚠️ Delete trip failed:", err);
    }
  };

  const handleDuplicateTrip = async (trip: TripData) => {
    try {
      await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...trip,
          _id: undefined,
          title: `${trip.title || trip.destination} (Copy)`,
          status: "Draft",
        }),
      });
      fetchTrips();
    } catch (err) {
      console.warn("⚠️ Duplicate trip failed:", err);
    }
  };

  const filteredTrips = trips.filter((t) => {
    const query = searchQuery.toLowerCase();
    return t.destination.toLowerCase().includes(query) || t.title.toLowerCase().includes(query);
  });

  return (
    <div className="flex w-full min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar onSelectChat={(id) => router.push(`/chat?id=${id}`)} onNewChat={() => router.push("/")} />

      <div className="flex-1 flex flex-col relative h-screen overflow-y-auto w-full p-6 md:p-12 space-y-8">
        
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
              <Compass className="w-3.5 h-3.5" /> Trip Planner Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-headline uppercase tracking-tight">
              My Travel <span className="text-primary">Journeys</span>
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              Manage saved itineraries, upcoming getaways, drafts, and shared trips.
            </p>
          </div>

          <Button
            onClick={handleCreateNewTrip}
            className="rounded-full font-black uppercase tracking-widest text-xs h-12 px-6 shadow-lg shadow-primary/20 hover:scale-105 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" /> Plan New Trip
          </Button>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card border border-border/60 p-3 rounded-3xl shadow-sm">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-hide">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "bg-primary text-white shadow-md shadow-primary/20 scale-105"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search destination or trip title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/40 border border-border/40 rounded-2xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Trips Grid */}
        {loading ? (
          <div className="h-64 flex items-center justify-center space-x-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-sm font-bold uppercase tracking-widest">Loading trips...</span>
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <TripCard
                key={trip._id}
                trip={trip}
                onEdit={(t) => router.push(`/destination/${encodeURIComponent(t.destination.toLowerCase())}`)}
                onDelete={handleDeleteTrip}
                onDuplicate={handleDuplicateTrip}
              />
            ))}
          </div>
        ) : (
          <div className="h-80 flex flex-col items-center justify-center text-center space-y-4 bg-card border border-dashed border-border/60 rounded-[3rem] p-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Compass className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-xl font-black font-headline uppercase">No trips found</h3>
              <p className="text-xs text-muted-foreground">
                You don&apos;t have any {activeTab !== "All" ? activeTab.toLowerCase() : ""} trips yet. Create your first itinerary!
              </p>
            </div>
            <Button onClick={handleCreateNewTrip} className="rounded-full font-black uppercase text-xs h-10 px-6">
              Create Trip Now
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
