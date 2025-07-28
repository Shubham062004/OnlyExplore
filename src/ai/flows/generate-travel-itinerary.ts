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

const ItineraryDaySchema = z.object({
  day: z.number().describe("The day number of the itinerary (e.g., 1, 2, 3)."),
  activities: z.array(z.string()).describe("A list of activities planned for the day."),
  cost: z.number().optional().describe("Estimated cost for the day's activities."),
});

const ItinerarySchema = z.object({
    destination: z.string().describe("The user's travel destination."),
    duration: z.number().describe("The total number of days for the trip."),
    budget: z.number().describe("The user's total budget for the trip."),
    interests: z.string().describe("The user's stated interests."),
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
  prompt: `You are a travel expert. Generate a personalized travel itinerary based on the following user preferences.
Your output MUST be a JSON object that strictly follows this schema: ${JSON.stringify(ItinerarySchema.jsonSchema)}

User Preferences:
Destination: {{destination}}
Duration: {{duration}}
Budget: {{budget}}
Interests: {{interests}}

Instructions:
1.  Parse the numeric values for duration and budget.
2.  Create a detailed itinerary with a specific plan for each day.
3.  Include specific places to visit, activities, and estimated costs for each day if possible.
4.  If the user's budget seems insufficient for their request, create the best itinerary possible and add a note in the 'notes' field explaining that the budget may be tight and suggest potential adjustments.
5.  Provide the output as a single, valid JSON string. Do not include any text or markdown formatting outside of the JSON object.
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
