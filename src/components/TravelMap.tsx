"use client";

import React from "react";
import { InteractiveSmartMap } from "@/components/ui/InteractiveSmartMap";

interface TravelMapProps {
  destination: string;
  distance?: number;
  travelTime?: number; // in minutes
  offlineMapLink?: string;
}

export function TravelMap({ destination }: TravelMapProps) {
  return <InteractiveSmartMap destination={destination} />;
}
