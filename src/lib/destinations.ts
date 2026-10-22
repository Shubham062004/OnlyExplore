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
  lucknow: {
    altitudeMeters: 123,
    temp: { min: 12, max: 32 },
    state: "Uttar Pradesh",
    country: "India",
  },
  palampur: {
    altitudeMeters: 1220,
    temp: { min: 8, max: 28 },
    state: "Himachal Pradesh",
    country: "India",
  },
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
  delhi: {
    altitudeMeters: 216,
    temp: { min: 8, max: 40 },
    state: "Delhi",
    country: "India",
  },
  varanasi: {
    altitudeMeters: 81,
    temp: { min: 10, max: 39 },
    state: "Uttar Pradesh",
    country: "India",
  },
  agra: {
    altitudeMeters: 171,
    temp: { min: 8, max: 42 },
    state: "Uttar Pradesh",
    country: "India",
  },
  udaipur: {
    altitudeMeters: 598,
    temp: { min: 11, max: 38 },
    state: "Rajasthan",
    country: "India",
  },
  bali: {
    altitudeMeters: 15,
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
  munnar: {
    altitudeMeters: 1532,
    temp: { min: 10, max: 25 },
    state: "Kerala",
    country: "India",
  },
  ooty: {
    altitudeMeters: 2240,
    temp: { min: 5, max: 22 },
    state: "Tamil Nadu",
    country: "India",
  },
  darjeeling: {
    altitudeMeters: 2042,
    temp: { min: 2, max: 19 },
    state: "West Bengal",
    country: "India",
  },
  srinagar: {
    altitudeMeters: 1585,
    temp: { min: -2, max: 30 },
    state: "Jammu & Kashmir",
    country: "India",
  },
};

/**
 * Format altitude from meters to a string including feet.
 * Handles numbers, strings with tildes, meters, or existing feet annotations.
 * Example: 2050 -> "2,050m (6,726 ft)"
 * Example: "~123 meters (404 feet)" -> "123m (404 ft)"
 */
export function formatAltitude(meters: number | string | undefined, destination?: string): string {
  // If destination metadata exists and has altitude, check it as a backup
  const key = destination?.toLowerCase().trim();
  const meta = key ? destinationMetadata[key] : null;

  if (meters === undefined || meters === "" || meters === "Varies" || meters === "Altitude unavailable" || meters === "Currently unavailable") {
    if (meta?.altitudeMeters) {
      const feet = Math.round(meta.altitudeMeters * 3.28084);
      return `${meta.altitudeMeters.toLocaleString()}m (${feet.toLocaleString()} ft)`;
    }
    return "Currently unavailable";
  }

  if (typeof meters === "string") {
    const cleaned = meters.replace(/^[~≈\s]+/, '').trim();

    // If it already contains meters/ft formatted nicely, clean up spaces/formatting
    if (/\d+\s*(m|meter|meters).*\d+\s*(ft|feet)/i.test(cleaned)) {
      // Normalize e.g. "123 meters (404 feet)" to "123m (404 ft)"
      return cleaned
        .replace(/meters?/gi, 'm')
        .replace(/feet/gi, 'ft');
    }

    // Extract first number
    const match = cleaned.match(/([\d,]+(?:\.\d+)?)/);
    if (match) {
      const num = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(num) && num > 0) {
        const feet = Math.round(num * 3.28084);
        return `${num.toLocaleString()}m (${feet.toLocaleString()} ft)`;
      }
    }

    if (meta?.altitudeMeters) {
      const feet = Math.round(meta.altitudeMeters * 3.28084);
      return `${meta.altitudeMeters.toLocaleString()}m (${feet.toLocaleString()} ft)`;
    }

    return cleaned || "Currently unavailable";
  }

  if (typeof meters === "number" && meters > 0) {
    const feet = Math.round(meters * 3.28084);
    return `${meters.toLocaleString()}m (${feet.toLocaleString()} ft)`;
  }

  if (meta?.altitudeMeters) {
    const feet = Math.round(meta.altitudeMeters * 3.28084);
    return `${meta.altitudeMeters.toLocaleString()}m (${feet.toLocaleString()} ft)`;
  }

  return "Currently unavailable";
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
  if (rawTemp && rawTemp !== "N/A" && rawTemp !== "Currently unavailable") {
    return {
      min: null,
      max: null,
      formatted: rawTemp,
    };
  }

  return {
    min: null,
    max: null,
    formatted: "Currently unavailable",
  };
}

/**
 * Format location as "State, Country"
 * Never returns generic placeholders like "State, India"
 */
export function formatLocation(destination: string, rawLocation?: string): string {
  const key = destination.toLowerCase().trim();
  const meta = destinationMetadata[key];

  if (meta) {
    return `${meta.state}, ${meta.country}`;
  }

  if (rawLocation && rawLocation !== "N/A" && rawLocation !== "Location unavailable") {
    // Reject generic placeholder patterns like "State, India" or just the destination name repeated
    const isGeneric = /^(State|Province|Region),\s*(India|Country)$/i.test(rawLocation.trim());
    if (!isGeneric) {
      // Clean up regional prefixes like "Northern India, Uttar Pradesh" -> "Uttar Pradesh, India"
      const cleaned = rawLocation
        .replace(/^(Northern|Southern|Eastern|Western|Central)\s+India,\s*/i, '')
        .trim();
      if (!cleaned.toLowerCase().includes('india') && !cleaned.toLowerCase().includes(',')) {
        return `${cleaned}, India`;
      }
      return cleaned;
    }
  }

  return "Currently unavailable";
}
