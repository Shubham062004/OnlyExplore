'use server';

/**
 * @fileOverview Summarizes a travel itinerary for quick review.
 *
 * - summarizeItinerary - A function that summarizes the itinerary.
 * - SummarizeItineraryInput - The input type for the summarizeItinerary function.
 * - SummarizeItineraryOutput - The return type for the summarizeItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeItineraryInputSchema = z.string().describe('The travel itinerary to summarize.');
export type SummarizeItineraryInput = z.infer<typeof SummarizeItineraryInputSchema>;

const SummarizeItineraryOutputSchema = z.string().describe('A summary of the travel itinerary.');
export type SummarizeItineraryOutput = z.infer<typeof SummarizeItineraryOutputSchema>;

export async function summarizeItinerary(itinerary: SummarizeItineraryInput): Promise<SummarizeItineraryOutput> {
  return summarizeItineraryFlow(itinerary);
}

const summarizeItineraryPrompt = ai.definePrompt({
  name: 'summarizeItineraryPrompt',
  input: {schema: SummarizeItineraryInputSchema},
  output: {schema: SummarizeItineraryOutputSchema},
  prompt: `Summarize the following travel itinerary in a concise and informative way:\n\n{{{itinerary}}}`,
});

const summarizeItineraryFlow = ai.defineFlow(
  {
    name: 'summarizeItineraryFlow',
    inputSchema: SummarizeItineraryInputSchema,
    outputSchema: SummarizeItineraryOutputSchema,
  },
  async itinerary => {
    const {output} = await summarizeItineraryPrompt(itinerary);
    return output!;
  }
);
