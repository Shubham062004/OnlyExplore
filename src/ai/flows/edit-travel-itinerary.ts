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

const EditItineraryInputSchema = z.object({
  itinerary: z.string().describe('The current travel itinerary as a JSON string.'),
  editRequest: z.string().describe('The user\'s requested change to the itinerary.'),
});
export type EditItineraryInput = z.infer<typeof EditItineraryInputSchema>;

const EditItineraryOutputSchema = z.object({
  updatedItinerary: z.string().describe('The updated travel itinerary, formatted as a JSON string that conforms to the ItinerarySchema.'),
});
export type EditItineraryOutput = z.infer<typeof EditItineraryOutputSchema>;

export async function editItinerary(input: EditItineraryInput): Promise<EditItineraryOutput> {
  return editItineraryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editItineraryPrompt',
  input: {schema: EditItineraryInputSchema},
  output: {
      schema: EditItineraryOutputSchema,
      format: 'json',
  },
  prompt: `You are a travel expert. The user has an existing itinerary and wants to make a change.
Your output MUST be a complete, updated JSON object that strictly follows this schema: ${JSON.stringify(ItinerarySchema.jsonSchema)}

Current Itinerary (as a JSON string):
{{itinerary}}

User's Edit Request:
"{{editRequest}}"

Instructions:
1.  Read the current itinerary and the user's request carefully.
2.  Modify the itinerary to reflect the requested changes. This may involve adding, removing, or changing days, activities, or destinations.
3.  Recalculate costs if necessary.
4.  Update the 'notes' field if the edit has implications for the budget or schedule.
5.  Return the complete, new itinerary as a single, valid JSON string. Do not include any text or markdown formatting outside of the JSON object.
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
