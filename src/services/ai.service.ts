import crypto from 'crypto';
import { cacheService } from './cache.service';
import { generateTravelItinerary, GenerateTravelItineraryInput, GenerateTravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import { editItinerary, EditItineraryInput, EditItineraryOutput } from '@/ai/flows/edit-travel-itinerary';
import { destinationMetadata } from '@/lib/destinations';
import { getDestinationImages } from '@/lib/imageService';

export class AiService {
  /**
   * Cleans natural language prompt into a primary destination name
   */
  static cleanDestination(inputDest: string): string {
    if (!inputDest) return "India";
    const cleaned = inputDest
      .replace(/\b(plan|a|an|the|budget|friendly|trip|to|for|with|friends|family|honeymoon|vacation|tour|days?|luxury|best|cheap|guide|me|please)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleaned || inputDest;
  }

  /**
   * Generates a SHA256 hash of any input object to use as a cache key
   */
  static hashInput(input: any): string {
    const str = JSON.stringify(input);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Generate travel itinerary with prompt hashing, 1-day Redis caching, retries, and resilient fallback.
   */
  static async generateItinerary(input: GenerateTravelItineraryInput): Promise<GenerateTravelItineraryOutput> {
    const cleanDest = this.cleanDestination(input.destination);
    const sanitizedInput: GenerateTravelItineraryInput = {
      ...input,
      destination: cleanDest,
      duration: input.duration || '5 days',
      budget: input.budget || '50000',
      interests: input.interests || 'Sightseeing, Local Culture & Food',
      plan: input.plan || 'pro',
    };

    const inputHash = this.hashInput({
      destination: cleanDest.toLowerCase(),
      duration: sanitizedInput.duration,
      budget: sanitizedInput.budget,
      interests: sanitizedInput.interests,
      plan: sanitizedInput.plan,
    });
    const cacheKey = `itinerary:${inputHash}`;

    // 1. Check Cache
    const cached = await cacheService.get<GenerateTravelItineraryOutput>(cacheKey);
    if (cached) {
      console.log(`[AiService] Cache hit for itinerary: ${cleanDest}`);
      return cached;
    }

    // 2. Execution with retries (Up to 2 attempts for faster responsiveness)
    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[AiService] Generating itinerary for "${cleanDest}" (Attempt ${attempt}/2)...`);
        const result = await generateTravelItinerary(sanitizedInput);
        if (result && result.days && result.days.length > 0) {
          // 3. Cache the successful result for 1 day
          await cacheService.set(cacheKey, result, 86400);
          return result;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[AiService] Attempt ${attempt} failed:`, err);
      }
    }

    // 3. Resilient Curated Fallback (Prevents 503 / 500 crashes when external AI is unavailable)
    console.warn(`[AiService] AI service unavailable for "${cleanDest}". Generating curated workspace fallback...`);
    const fallbackResult = await this.generateCuratedFallback(sanitizedInput);
    await cacheService.set(cacheKey, fallbackResult, 3600);
    return fallbackResult;
  }

  /**
   * Synthesize a rich destination itinerary when external AI model is temporarily rate limited or 503.
   */
  static async generateCuratedFallback(input: GenerateTravelItineraryInput): Promise<GenerateTravelItineraryOutput> {
    const dest = this.cleanDestination(input.destination);
    const metaKey = Object.keys(destinationMetadata).find(
      (k) => dest.toLowerCase().includes(k) || k.includes(dest.toLowerCase())
    );
    const meta = metaKey ? destinationMetadata[metaKey] : null;
    const images = await getDestinationImages(dest).catch(() => ({
      heroImage: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1000",
      popularPlaces: [],
      nearby: []
    }));

    const durationDays = parseInt(input.duration.replace(/\D/g, ''), 10) || 5;
    const budgetNum = parseInt(input.budget.replace(/[^\d]/g, ''), 10) || 45000;

    const days = [
      {
        day: 1,
        theme: `Arrival & Welcome to ${dest}`,
        morning: [{ name: `Check-in & Morning Refresh`, description: `Arrive in ${dest}, settle into your accommodation and soak in the initial ambiance.` }],
        afternoon: [{ name: `Scenic Local Promenade & Cafes`, description: `Stroll through the town center, visit artisanal cafes, and savor local regional delicacies.` }],
        evening: [{ name: `Sunset Viewpoint & Welcome Dinner`, description: `Catch panoramic golden hour views over ${dest} followed by traditional dinner.` }],
        cost: Math.round(budgetNum * 0.15),
        travelTips: "Keep light woolens or comfortable walking footwear ready for the first evening.",
      },
      {
        day: 2,
        theme: `Heritage, Culture & Highlights`,
        morning: [{ name: `Signature Landmark Exploration`, description: `Visit the most prominent heritage attraction and cultural monuments in ${dest}.` }],
        afternoon: [{ name: `Local Craft & Artisan Bazaar`, description: `Explore vibrant local markets, discover handmade crafts, and sample authentic street cuisine.` }],
        evening: [{ name: `Riverside / Valley Stroll`, description: `Relax by scenic natural lookouts with peaceful views and regional dinner.` }],
        cost: Math.round(budgetNum * 0.22),
        travelTips: "Hire a verified local guide or use auto-rickshaws for hassle-free commute.",
      },
      {
        day: 3,
        theme: `Nature Escapes & Outdoor Adventure`,
        morning: [{ name: `Scenic Nature Trail & Viewpoints`, description: `Early morning excursion to renowned trails, forest walks, and sweeping panoramic peaks.` }],
        afternoon: [{ name: `Hidden Waterfalls & Valley Cafes`, description: `Unwind by serene streams or hillside terraces enjoying locally brewed tea/coffee.` }],
        evening: [{ name: `Bonfire & Stargazing Experience`, description: `Enjoy evening leisure with local music, warm hospitality, and traditional cuisine.` }],
        cost: Math.round(budgetNum * 0.25),
        travelTips: "Carry a reusable water bottle and power bank for the outdoor day.",
      },
      {
        day: 4,
        theme: `Local Secrets & Spiritual Haven`,
        morning: [{ name: `Historic Monasteries & Sacred Sites`, description: `Discover tranquil spiritual centers and historic architecture unique to the region.` }],
        afternoon: [{ name: `Tea Estate / Countryside Walk`, description: `Walk among lush plantations, interact with local growers, and enjoy curated tastings.` }],
        evening: [{ name: `Celebratory Fine Dining`, description: `Indulge in a signature culinary experience highlighting authentic regional specialties.` }],
        cost: Math.round(budgetNum * 0.20),
        travelTips: "Respect local customs and photography guidelines at spiritual landmarks.",
      },
      {
        day: 5,
        theme: `Farewell & Souvenir Treasures`,
        morning: [{ name: `Sunrise Photography & Leisure Brunch`, description: `Capture final photos of morning mist over ${dest} and enjoy a relaxed breakfast.` }],
        afternoon: [{ name: `Handicrafts Shopping & Packing`, description: `Pick up famous regional teas, spices, textiles, and handcrafted souvenirs.` }],
        evening: [{ name: `Departure Journey`, description: `Head to the transit terminal with unforgettable memories of ${dest}.` }],
        cost: Math.round(budgetNum * 0.18),
        travelTips: "Keep luggage receipts and booking documents handy for departure.",
      },
    ].slice(0, Math.max(3, durationDays));

    return {
      destination: dest,
      duration: durationDays,
      budget: budgetNum,
      interests: ["Sightseeing", "Local Culture", "Nature & Scenery", "Photography"],
      tripOverview: {
        bestTime: "September to May",
        currency: "INR (₹)",
        visa: "Indian Domestic / E-Visa for International Travelers",
        language: "Hindi, English & Regional Dialects",
        averageTemperature: meta ? `${meta.temp.min}°C – ${meta.temp.max}°C` : "18°C – 26°C",
      },
      budgetBreakdown: {
        flights: Math.round(budgetNum * 0.30),
        hotels: Math.round(budgetNum * 0.35),
        food: Math.round(budgetNum * 0.15),
        activities: Math.round(budgetNum * 0.12),
        transport: Math.round(budgetNum * 0.08),
        total: budgetNum,
      },
      days,
      hotels: [
        { name: `${dest} Heritage Retreat & Homestay`, type: "Budget", rating: "4.6", location: "Central Town" },
        { name: `${dest} Valley View Resort & Spa`, type: "Mid-range", rating: "4.8", location: "Scenic Hillside" },
        { name: `The Grand Pines Luxury Estate`, type: "Luxury", rating: "4.9", location: "Exclusive Panoramic Ridge" },
      ],
      restaurants: [
        { name: "The Mountain Mist Cafe", cuisine: "Local & Continental Fusion" },
        { name: "Heritage Rasoi", cuisine: "Authentic Regional Thali" },
        { name: "Cloud Nine Rooftop Lounge", cuisine: "Woodfired Oven & Mocktails" },
      ],
      emergencyInfo: {
        emergencyNumber: "112 / 108",
        hospital: `${dest} Civil Hospital & Trauma Centre`,
        embassy: "Nearest Consular Services: New Delhi",
      },
      totalCost: budgetNum,
      notes: `Curated personalized itinerary for ${dest}. Tailored for ${input.interests || 'friends and group travel'}.`,
      packingChecklist: [
        "Comfortable walking / trekking shoes",
        "Layered light woolens / jacket for evening",
        "Sunscreen, sunglasses, and wide-brim hat",
        "Personal medical kit & motion sickness meds",
        "High-capacity power bank & camera",
      ],
      travelEssentials: [
        "Government ID (Aadhaar / Passport)",
        "UPI payment apps & some physical cash",
        "Offline maps downloaded on smartphone",
        "Pre-booked local transport / cab contact",
      ],
      healthSafety: [
        "Stay hydrated and avoid unbottled water outdoors",
        "Check local weather alerts before high-altitude excursions",
      ],
      heroImage: images.heroImage,
      images: {
        hero: images.heroImage,
        popularPlaces: images.popularPlaces,
        nearby: images.nearby,
      },
    };
  }

  /**
   * Edit travel itinerary with retries.
   */
  static async editItinerary(input: EditItineraryInput): Promise<EditItineraryOutput> {
    let lastError: any = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[AiService] Editing itinerary (Attempt ${attempt}/2)...`);
        const result = await editItinerary(input);
        if (result) {
          return result;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[AiService] Edit attempt ${attempt} failed:`, err);
      }
    }
    throw lastError || new Error("AI itinerary editing failed after 2 attempts.");
  }
}

export default AiService;

