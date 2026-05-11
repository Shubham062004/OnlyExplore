import { fetchPremiumImage, generateContextualQuery } from './imageService';

/**
 * Migration helper to bridge the new premium image service 
 * with the existing destination guide flow.
 */
export async function fetchDestinationImages(destination: string) {
  try {
    // Parallel fetch for hero and categories
    const [hero, landmark, activity, stay] = await Promise.all([
      fetchPremiumImage(generateContextualQuery({ destination, category: 'hero' }), { cacheKey: `${destination}-hero` }),
      fetchPremiumImage(generateContextualQuery({ destination, category: 'landmark' }), { cacheKey: `${destination}-landmark` }),
      fetchPremiumImage(generateContextualQuery({ destination, category: 'activity' }), { cacheKey: `${destination}-activity` }),
      fetchPremiumImage(generateContextualQuery({ destination, category: 'stay' }), { cacheKey: `${destination}-stay` }),
    ]);
    
    return {
      hero,
      places: [landmark],
      activities: [activity],
      hotels: [stay],
    };
  } catch (error) {
    console.error("fetchDestinationImages fallback error:", error);
    const fallback = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000&auto=format&fit=crop";
    return {
      hero: fallback,
      places: [fallback],
      activities: [fallback],
      hotels: [fallback]
    };
  }
}
