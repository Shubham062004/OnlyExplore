"use client";

import React from "react";
import { Download, MapPin, Navigation, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TravelMapProps {
  destination: string;
  distance?: number;
  travelTime?: number; // in minutes
  offlineMapLink?: string;
}

export function TravelMap({ destination, distance, travelTime, offlineMapLink }: TravelMapProps) {
  // If time in minutes, convert to hours and mins
  const formatTime = (time?: number) => {
    if (!time) return "N/A";
    const hrs = Math.floor(time / 60);
    const mins = time % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-xl bg-card shadow-sm">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold flex items-center gap-2">
          <MapPin className="w-5 h-5 text-accent" />
          {destination} Map
        </h4>
        {offlineMapLink && (
          <Button variant="outline" size="sm" onClick={() => window.open(offlineMapLink, '_blank')}>
            <Download className="w-4 h-4 mr-2" />
            Download Offline Map
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
          <Navigation className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase">Travel Distance</span>
            <span className="text-sm font-semibold">{distance ? `${Math.round(distance)} km` : "N/A"}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border">
          <Clock className="w-5 h-5 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase">Travel Time</span>
            <span className="text-sm font-semibold">{formatTime(travelTime)}</span>
          </div>
        </div>
      </div>

      <div className="w-full h-48 bg-slate-200 rounded-lg overflow-hidden relative flex items-center justify-center border">
        {offlineMapLink ? (
          <img src={offlineMapLink} alt={`Map of ${destination}`} className="w-full h-full object-cover" />
        ) : (
          <p className="text-muted-foreground text-sm font-medium">Map view requires API configuration.</p>
        )}
      </div>
    </div>
  );
}
