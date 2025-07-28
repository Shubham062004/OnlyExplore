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
  duration: z.string().describe('The duration of the trip (e.g., 5 days, 1 week).'),
  budget: z.string().describe('The budget for the trip (e.g., $1000, €800).'),
  interests: z.string().describe('A comma-separated list of interests (e.g., history, art, food).'),
});
export type GenerateTravelItineraryInput = z.infer<typeof GenerateTravelItineraryInputSchema>;

const GenerateTravelItineraryOutputSchema = z.object({
  itinerary: z.string().describe('A detailed travel itinerary based on the user preferences.'),
});
export type GenerateTravelItineraryOutput = z.infer<typeof GenerateTravelItineraryOutputSchema>;

export async function generateTravelItinerary(input: GenerateTravelItineraryInput): Promise<GenerateTravelItineraryOutput> {
  return generateTravelItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTravelItineraryPrompt',
  input: {schema: GenerateTravelItineraryInputSchema},
  output: {schema: GenerateTravelItineraryOutputSchema},
  prompt: `You are a travel expert. Generate a personalized travel itinerary based on the following user preferences:

Destination: {{{destination}}}
Duration: {{{duration}}}
Budget: {{{budget}}}
Interests: {{{interests}}}

Create a detailed itinerary including specific places to visit, activities to do, and estimated costs. Provide suggestions for hotels and restaurants.
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
