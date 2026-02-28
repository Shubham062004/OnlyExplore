'use server';
/**
 * @fileOverview A travel itinerary generation AI agent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateTravelItineraryInputSchema = z.object({
  destination: z.string().describe('The desired travel destination.'),
  duration: z.string().describe('The duration of the trip (e.g., "5 days", "1 week").'),
  budget: z.string().describe('The budget for the trip (e.g., "$1000", "₹80000").'),
  interests: z.string().describe('Comma-separated interests (e.g., "history, food").'),
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
});

export type GenerateTravelItineraryOutput =
  z.infer<typeof ItinerarySchema>;

const prompt = ai.definePrompt({
  name: 'generateTravelItineraryPrompt',
  input: { schema: GenerateTravelItineraryInputSchema },

  // 🔥 IMPORTANT: Return structured object directly
  output: {
    schema: ItinerarySchema,
    format: 'json',
  },

  prompt: `
You are a travel expert specializing in Indian travel planning.

Return ONLY valid JSON matching the required schema.

Rules:
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
`,
});

const generateTravelItineraryFlow = ai.defineFlow(
  {
    name: 'generateTravelItineraryFlow',
    inputSchema: GenerateTravelItineraryInputSchema,
    outputSchema: ItinerarySchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
      throw new Error('AI failed to generate itinerary.');
    }

    return output;
  }
);

export async function generateTravelItinerary(
  input: GenerateTravelItineraryInput
): Promise<GenerateTravelItineraryOutput> {
  return generateTravelItineraryFlow(input);
}