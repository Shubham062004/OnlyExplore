import { getDestinationImages, getImageUrl } from './imageService';

/**
 * Migration helper to bridge the new Gemini-powered image service 
 * with the existing destination guide flow.
 */
export async function fetchDestinationImages(destination: string) {
  try {
    const dynamicData = await getDestinationImages(destination);
    
    // Transform the Gemini search-based results into the format 
    // expected by the DestinationGuide model and UI components.
    // Using the query-powered URLs directly now.
    return {
      hero: dynamicData.heroImage,
      places: dynamicData.popularPlaces.map(p => p.image),
      // For activities and hotels, we generate a few more specific ones to avoid mismatches
      activities: [
        getImageUrl(`${destination} adventure activities outdoor`),
        getImageUrl(`${destination} local food experience cooking`),
        getImageUrl(`${destination} mountain trekking hiking`),
        getImageUrl(`${destination} historical cultural tour guide`),
      ],
      hotels: [
        getImageUrl(`${destination} luxury five star resort hotel`),
        getImageUrl(`${destination} cozy heritage boutique stay`),
        getImageUrl(`${destination} budget eco-friendly hostel travel`),
      ],
    };
  } catch (error) {
    console.error("fetchDestinationImages fallback error:", error);
    // Absolute fallback to a reliable Unsplash search query
    const encoded = encodeURIComponent(destination);
    return {
      hero: getImageUrl(`${destination} city morning aerial view`),
      places: [
        getImageUrl(`${destination} landmark iconic building 1`),
        getImageUrl(`${destination} street view landmark 2`),
      ],
      activities: [
        getImageUrl(`${destination} adventure boat tour`),
      ],
      hotels: [
        getImageUrl(`${destination} hotel luxury room interior`),
      ]
    };
  }
}
