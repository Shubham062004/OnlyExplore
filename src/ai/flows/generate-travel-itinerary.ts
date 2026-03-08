'use server';
/**
 * @fileOverview A travel itinerary generation AI agent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';
import { getWeatherForDestination } from '@/lib/weather';
import { getCoordinates, generateOfflineMapLink } from '@/lib/maps';

const GenerateTravelItineraryInputSchema = z.object({
  destination: z.string().describe('The desired travel destination.'),
  duration: z.string().describe('The duration of the trip (e.g., "5 days", "1 week").'),
  budget: z.string().describe('The budget for the trip (e.g., "$1000", "₹80000").'),
  interests: z.string().describe('Comma-separated interests (e.g., "history, food").'),
  plan: z.string().optional().describe('User plan: free or pro'),
});

export type GenerateTravelItineraryInput =
  z.infer<typeof GenerateTravelItineraryInputSchema>;

// We define the shape inline to prevent Genkit from generating $ref 
// in JSON Schema which Gemini API strictly rejects.

const TripOverviewSchema = z.object({
  bestTime: z.string().optional(),
  currency: z.string().optional(),
  visa: z.string().optional(),
  language: z.string().optional(),
  averageTemperature: z.string().optional(),
});

const HotelSchema = z.object({
  name: z.string(),
  type: z.enum(['Budget', 'Mid-range', 'Luxury']).optional(),
  rating: z.string().optional(),
  location: z.string().optional(),
});

const RestaurantSchema = z.object({
  name: z.string(),
  cuisine: z.string().optional(),
});

const EmergencySchema = z.object({
  emergencyNumber: z.string().optional(),
  hospital: z.string().optional(),
  embassy: z.string().optional(),
});

const BudgetSchema = z.object({
  flights: z.number().optional(),
  hotels: z.number().optional(),
  food: z.number().optional(),
  activities: z.number().optional(),
  transport: z.number().optional(),
  total: z.number().optional()
});

const ItineraryDaySchema = z.object({
  day: z.number(),
  theme: z.string().optional(),
  morning: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
  afternoon: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
  evening: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
  cost: z.number().optional(),
  travelTips: z.string().optional(),

  // Fallback
  activities: z.array(z.object({ name: z.string(), description: z.string().optional() })).optional(),
});

const ItinerarySchema = z.object({
  destination: z.string(),
  duration: z.number(),
  budget: z.number(),
  interests: z.array(z.string()),
  
  tripOverview: TripOverviewSchema.optional(),
  budgetBreakdown: BudgetSchema.optional(),
  
  days: z.array(ItineraryDaySchema),
  hotels: z.array(HotelSchema).optional(),
  restaurants: z.array(RestaurantSchema).optional(),
  emergencyInfo: EmergencySchema.optional(),

  totalCost: z.number().optional(),
  notes: z.string().optional(),
  weatherForecast: z.any().optional(),
  packingChecklist: z.array(z.string()).optional(),
  travelEssentials: z.array(z.string()).optional(),
  healthSafety: z.array(z.string()).optional(),
  campingGear: z.array(z.string()).optional(),
  travelCostBreakdown: z.any().optional(),
  mapNavigation: z.any().optional(),
  offlineMapLink: z.string().optional(),
});

export type GenerateTravelItineraryOutput =
  z.infer<typeof ItinerarySchema>;

const PromptInputSchema = GenerateTravelItineraryInputSchema.extend({
  weatherInfo: z.string().optional(),
  coordinatesInfo: z.string().optional(),
  offlineLink: z.string().optional(),
});

const prompt = ai.definePrompt({
  name: 'generateTravelItineraryPrompt',
  input: { schema: PromptInputSchema },

  // 🔥 IMPORTANT: Return structured object directly
  output: {
    schema: ItinerarySchema,
    format: 'json',
  },

  prompt: `
You are a travel expert specializing in Indian travel planning.

Return ONLY valid JSON matching the required schema.

Rules for ALL users:
- Duration must be a NUMBER (days).
- Budget must be a NUMBER in INR.
- Convert USD to INR using rate: 1 USD = 88.7 INR.
- All costs must be realistic for Indian travelers.
- Provide day-wise structured plan.
- No markdown.
- No extra explanation.
- No wrapping inside strings.

User Input:
Destination: {{destination}}
Duration: {{duration}}
Budget: {{budget}}
Interests: {{interests}}
Plan: {{plan}}

Fetched Live Data:
Weather: {{weatherInfo}}
Coordinates: {{coordinatesInfo}}
Offline Map Link: {{offlineLink}}

If Plan is "pro", generate a structured travel dashboard including:
- tripOverview: Best time to visit, currency, visa, language, average temperature.
- budgetBreakdown: Cost estimation for flights, hotels, food, activities, transport, and total.
- hotels: 3 recommendations (Budget, Mid-range, Luxury) with rating and location.
- restaurants: Local food recommendations.
- emergencyInfo: Emergency number, hospital, embassy.
- Provide a detailed Packing Checklist (packingChecklist)
- Provide Travel Essentials (travelEssentials)
- Include Map Navigation details like distance and travel time between day locations (mapNavigation)
- Include the provided offlineMapLink string if available (offlineMapLink)
- Add weather overview using the provided Weather data (weatherForecast)

For BOTH "free" and "pro", each day in 'days' should ideally have:
- A custom 'theme' for the day
- Segmented activities into 'morning', 'afternoon', and 'evening'
- An estimated 'cost' for that day
- Useful 'travelTips' for the day

If Plan is "free" or omitted, provide ONLY the basic details and omit the advanced intelligence fields (tripOverview, budgetBreakdown, hotels, restaurants, emergencyInfo, packingChecklist, travelEssentials, mapNavigation, offlineMapLink, weatherForecast).
`,
});

const generateTravelItineraryFlow = ai.defineFlow(
  {
    name: 'generateTravelItineraryFlow',
    inputSchema: GenerateTravelItineraryInputSchema,
    outputSchema: ItinerarySchema,
    streamSchema: z.string(),
  },
  async (input, { sendChunk }) => {
    const startTime = Date.now();
    try {
      sendChunk("Initializing travel planner...");
      let weatherInfo = "";
      let coordinatesInfo = "";
      let offlineLink = "";

      if (input.plan === 'pro') {
        sendChunk("Fetching premium weather and map data...");
        const [weather, coords] = await Promise.all([
          getWeatherForDestination(input.destination),
          getCoordinates(input.destination),
        ]);
        if (weather) weatherInfo = JSON.stringify(weather);
        if (coords) {
          coordinatesInfo = JSON.stringify(coords);
          const link = generateOfflineMapLink(input.destination, coords);
          if (link) offlineLink = link;
        }
      }

      sendChunk("Crafting personalized itinerary days...");
      const promptInput = {
        ...input,
        weatherInfo,
        coordinatesInfo,
        offlineLink,
      };

      const { output } = await prompt(promptInput);

      if (!output) {
        throw new Error('AI failed to generate itinerary.');
      }

      sendChunk("Finalizing budget and packing guide...");
      metrics.trackAiGeneration('generateTravelItinerary', Date.now() - startTime, true);
      return output;
    } catch (error: any) {
      logger.error('AI Generation Error', { error: error.message, flow: 'generateTravelItinerary' });
      metrics.trackAiGeneration('generateTravelItinerary', Date.now() - startTime, false);
      throw error;
    }
  }
);

export async function generateTravelItinerary(
  input: GenerateTravelItineraryInput
): Promise<GenerateTravelItineraryOutput> {
  return generateTravelItineraryFlow(input);
}