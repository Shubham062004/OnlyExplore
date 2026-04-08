/**
 * Generates context-aware, structured Unsplash image search queries for a given location.
 * Adding "India" ensures better results for places like 'Lucknow' or 'Manali'.
 */
export function getCityImageQueries(city: string) {
  // Check if it's likely an Indian city or generic
  // Basic assumption: most city names in this app's current context are Indian.
  const suffix = "India tourism";

  return {
    hero: `${city} ${suffix} skyline aerial view landscape`,
    places: `${city} ${suffix} famous landmarks monuments tourist attractions`,
    activities: `${city} ${suffix} things to do travel experience culture`,
    food: `${city} ${suffix} local street food cuisine markets`,
    hotels: `${city} ${suffix} luxury hotels architecture exterior`,
  };
}

export type CityImageQueries = ReturnType<typeof getCityImageQueries>;
