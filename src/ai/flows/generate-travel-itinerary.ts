'use server';
/**
 * @fileOverview A travel itinerary generation AI agent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { metrics } from '@/lib/metrics';
import { logger } from '@/lib/logger';
import { getWeatherForecast } from '@/lib/weather';
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

const ActivitySchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

const ItineraryDaySchema = z.object({
  day: z.number(),
  activities: z.array(ActivitySchema),
  cost: z.number().optional(),
});

const ItinerarySchema = z.object({
  destination: z.string(),
  duration: z.number(),
  budget: z.number(),
  interests: z.array(z.string()),
  days: z.array(ItineraryDaySchema),
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

If Plan is "pro", generate advanced travel intelligence:
- Provide a detailed Packing Checklist (packingChecklist)
- Provide Travel Essentials (travelEssentials)
- Provide Health and Safety recommendations (healthSafety)
- Provide Camping Gear suggestions if applicable (campingGear)
- Provide a Travel Cost Breakdown in INR (travelCostBreakdown)
- Include Map Navigation details like distance and travel time between day locations (mapNavigation)
- Include the provided offlineMapLink string if available (offlineMapLink)
- Add weather overview using the provided Weather data (weatherForecast)

If Plan is "free" or omitted, provide ONLY the basic itinerary and omit the advanced intelligence fields above.
`,
});

const generateTravelItineraryFlow = ai.defineFlow(
  {
    name: 'generateTravelItineraryFlow',
    inputSchema: GenerateTravelItineraryInputSchema,
    outputSchema: ItinerarySchema,
  },
  async (input) => {
    const startTime = Date.now();
    try {
      let weatherInfo = "";
      let coordinatesInfo = "";
      let offlineLink = "";

      if (input.plan === 'pro') {
        const [weather, coords] = await Promise.all([
          getWeatherForecast(input.destination),
          getCoordinates(input.destination),
        ]);
        if (weather) weatherInfo = JSON.stringify(weather);
        if (coords) {
          coordinatesInfo = JSON.stringify(coords);
          const link = generateOfflineMapLink(input.destination, coords);
          if (link) offlineLink = link;
        }
      }

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