'use server';
/**
 * @fileOverview A travel itinerary generation AI agent.
 *
 * - generateTravelItinerary - A function that handles the travel itinerary generation process.
 * - GenerateTravelItineraryInput - The input type for the generateTravelItinerary function.
 * - GenerateTravelItineraryOutput - The return type for the generateTravelItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTravelItineraryInputSchema = z.object({
  destination: z.string().describe('The desired travel destination.'),
  duration: z.string().describe('The duration of the trip (e.g., "5 days", "1 week").'),
  budget: z.string().describe('The budget for the trip (e.g., "$1000", "€800").'),
  interests: z.string().describe('A comma-separated list of interests (e.g., "history, art, food").'),
});
export type GenerateTravelItineraryInput = z.infer<typeof GenerateTravelItineraryInputSchema>;

const ActivitySchema = z.object({
  name: z.string().describe('A short, catchy name for the activity.'),
  description: z.string().optional().describe('A brief, one-sentence description of the activity.'),
});

const ItineraryDaySchema = z.object({
  day: z.number().describe("The day number of the itinerary (e.g., 1, 2, 3)."),
  activities: z.array(ActivitySchema).describe("A list of activities planned for the day. Each activity should be an object with a 'name' and optional 'description'."),
  cost: z.number().optional().describe("Estimated cost for the day's activities."),
});

const ItinerarySchema = z.object({
    destination: z.string().describe("The user's travel destination."),
    duration: z.number().describe("The total number of days for the trip."),
    budget: z.number().describe("The user's total budget for the trip."),
    interests: z.array(z.string()).describe("A list of the user's interests that were considered."),
    days: z.array(ItineraryDaySchema).describe("A detailed plan for each day of the trip."),
    totalCost: z.number().optional().describe("The total estimated cost for the entire itinerary."),
    notes: z.string().optional().describe("Any additional notes, warnings (e.g., about budget), or suggestions."),
});

const GenerateTravelItineraryOutputSchema = z.object({
  itinerary: z.string().describe('A detailed travel itinerary based on the user preferences, formatted as a JSON string that conforms to the ItinerarySchema.'),
});
export type GenerateTravelItineraryOutput = z.infer<typeof GenerateTravelItineraryOutputSchema>;


export async function generateTravelItinerary(input: GenerateTravelItineraryInput): Promise<GenerateTravelItineraryOutput> {
  return generateTravelItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTravelItineraryPrompt',
  input: {schema: GenerateTravelItineraryInputSchema},
  output: {
      schema: GenerateTravelItineraryOutputSchema,
      format: 'json'
  },
  prompt: `You are a travel expert specializing in Indian travel planning. Generate a travel itinerary in STRICT JSON format only.

CRITICAL: Your response must be ONLY valid JSON with no markdown, no comments, no extra text.

Required JSON structure:
{
  "destination": "string",
  "duration": number,
  "budget": number,
  "interests": ["string1", "string2"],
  "days": [
    {
      "day": number,
      "activities": [
        {"name": "string", "description": "string"}
      ],
      "cost": number
    }
  ],
  "notes": "string"
}

User inputs: destination={{destination}}, duration={{duration}}, budget={{budget}}, interests={{interests}}

Instructions:
1. Parse the numeric values for duration and budget from input strings.
2. All costs should be in Indian Rupees (₹).
3. If budget is provided in USD ($), convert to INR using rate: $1 = ₹88.7
4. Create detailed day-wise activities with realistic Indian pricing.
5. Provide cost estimates per day in rupees.
6. Include practical travel tips for Indian travelers.

Return ONLY the JSON object, nothing else.
`,
});

const generateTravelItineraryFlow = ai.defineFlow(
  {
    name: 'generateTravelItineraryFlow',
    inputSchema: GenerateTravelItineraryInputSchema,
    outputSchema: GenerateTravelItineraryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
