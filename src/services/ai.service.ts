import crypto from 'crypto';
import { cacheService } from './cache.service';
import { generateTravelItinerary, GenerateTravelItineraryInput, GenerateTravelItineraryOutput } from '@/ai/flows/generate-travel-itinerary';
import { editItinerary, EditItineraryInput, EditItineraryOutput } from '@/ai/flows/edit-travel-itinerary';

export class AiService {
  /**
   * Generates a SHA256 hash of any input object to use as a cache key
   */
  static hashInput(input: any): string {
    const str = JSON.stringify(input);
    return crypto.createHash('sha256').update(str).digest('hex');
  }

  /**
   * Generate travel itinerary with prompt hashing, 1-day Redis caching, retries, and error boundaries.
   */
  static async generateItinerary(input: GenerateTravelItineraryInput): Promise<GenerateTravelItineraryOutput> {
    const inputHash = this.hashInput({
      destination: input.destination.toLowerCase().trim(),
      duration: input.duration,
      budget: input.budget,
      interests: input.interests,
      plan: input.plan || 'free'
    });
    const cacheKey = `itinerary:${inputHash}`;

    // 1. Check Cache
    const cached = await cacheService.get<GenerateTravelItineraryOutput>(cacheKey);
    if (cached) {
      console.log(`[AiService] Cache hit for itinerary hash: ${inputHash}`);
      return cached;
    }

    // 2. Execution with retries (Up to 3 attempts)
    let lastError: any = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[AiService] Generating itinerary (Attempt ${attempt}/3)...`);
        const result = await generateTravelItinerary(input);
        if (result) {
          // 3. Cache the successful result for 1 day (86400 seconds)
          await cacheService.set(cacheKey, result, 86400);
          return result;
        }
      } catch (err) {
        lastError = err;
        console.warn(`[AiService] Attempt ${attempt} failed:`, err);
      }
    }

    throw lastError || new Error("AI itinerary generation failed after 3 attempts.");
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
