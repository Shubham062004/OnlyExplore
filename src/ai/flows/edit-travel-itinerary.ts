'use server';

/**
 * @fileOverview A flow that allows users to request real-time edits to their generated travel itinerary through a chat interface.
 *
 * - editItinerary - A function that handles the itinerary editing process.
 * - EditItineraryInput - The input type for the editItinerary function.
 * - EditItineraryOutput - The return type for the editItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EditItineraryInputSchema = z.object({
  itinerary: z.string().describe('The current travel itinerary.'),
  editRequest: z.string().describe('The requested edit to the itinerary.'),
});
export type EditItineraryInput = z.infer<typeof EditItineraryInputSchema>;

const EditItineraryOutputSchema = z.object({
  updatedItinerary: z.string().describe('The updated travel itinerary.'),
});
export type EditItineraryOutput = z.infer<typeof EditItineraryOutputSchema>;

export async function editItinerary(input: EditItineraryInput): Promise<EditItineraryOutput> {
  return editItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editItineraryPrompt',
  input: {schema: EditItineraryInputSchema},
  output: {schema: EditItineraryOutputSchema},
  prompt: `You are a travel expert. The user has the following itinerary:

  {{itinerary}}

  The user wants to make the following edit to the itinerary:

  {{editRequest}}

  Please update the itinerary to reflect the user's request. Return the complete updated itinerary.
  Make sure the returned itinerary is well-formatted and easy to read.
  `,
});

const editItineraryFlow = ai.defineFlow(
  {
    name: 'editItineraryFlow',
    inputSchema: EditItineraryInputSchema,
    outputSchema: EditItineraryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
