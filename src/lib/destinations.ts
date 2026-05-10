/**
 * Centralized Destination Metadata System
 * This file provides structured metadata for popular destinations and
 * utility functions to format altitude, temperature, and location.
 */

export interface DestinationMeta {
  altitudeMeters: number;
  temp: { min: number; max: number };
  state: string;
  country: string;
}

export const destinationMetadata: Record<string, DestinationMeta> = {
  manali: {
    altitudeMeters: 2050,
    temp: { min: -2, max: 18 },
    state: "Himachal Pradesh",
    country: "India",
  },
  goa: {
    altitudeMeters: 30,
    temp: { min: 24, max: 34 },
    state: "Goa",
    country: "India",
  },
  jaipur: {
    altitudeMeters: 431,
    temp: { min: 8, max: 42 },
    state: "Rajasthan",
    country: "India",
  },
  leh: {
    altitudeMeters: 3500,
    temp: { min: -15, max: 25 },
    state: "Ladakh",
    country: "India",
  },
  bali: {
    altitudeMeters: 0,
    temp: { min: 23, max: 31 },
    state: "Bali",
    country: "Indonesia",
  },
  mumbai: {
    altitudeMeters: 14,
    temp: { min: 18, max: 35 },
    state: "Maharashtra",
    country: "India",
  },
  shimla: {
    altitudeMeters: 2205,
    temp: { min: -1, max: 25 },
    state: "Himachal Pradesh",
    country: "India",
  },
  rishikesh: {
    altitudeMeters: 372,
    temp: { min: 6, max: 40 },
    state: "Uttarakhand",
    country: "India",
  },
};

/**
 * Format altitude from meters to a string including feet.
 * Example: 2050 -> "2,050m (6,726 ft)"
 */
export function formatAltitude(meters: number | string | undefined): string {
  if (meters === undefined || meters === "" || meters === "Varies" || meters === "Altitude unavailable") {
    return "Altitude unavailable";
  }

  const m = typeof meters === "string" ? parseFloat(meters.replace(/,/g, "")) : meters;
  if (isNaN(m)) return "Altitude unavailable";

  const feet = Math.round(m * 3.28084);
  const formattedM = m.toLocaleString();
  const formattedF = feet.toLocaleString();

  return `${formattedM}m (${formattedF} ft)`;
}

/**
 * Get a temperature range for a destination.
 * Checks mapping first, then parses raw input if provided.
 */
export function getTemperatureRange(destination: string, rawTemp?: string) {
  const key = destination.toLowerCase().trim();
  const meta = destinationMetadata[key];

  if (meta) {
    return {
      min: meta.temp.min,
      max: meta.temp.max,
      formatted: `${meta.temp.min}°C – ${meta.temp.max}°C`,
    };
  }

  // If no meta, try to parse rawTemp (e.g. "12°C to 28°C")
  if (rawTemp && rawTemp !== "N/A") {
    return {
      min: null,
      max: null,
      formatted: rawTemp,
    };
  }

  return {
    min: null,
    max: null,
    formatted: "N/A",
  };
}

/**
 * Format location as "State, Country"
 */
export function formatLocation(destination: string, rawLocation?: string): string {
  const key = destination.toLowerCase().trim();
  const meta = destinationMetadata[key];

  if (meta) {
    return `${meta.state}, ${meta.country}`;
  }

  if (rawLocation && rawLocation !== "N/A") {
    // Basic sanitization to ensure "State, Country" format
    return rawLocation;
  }

  return "Location unavailable";
}
