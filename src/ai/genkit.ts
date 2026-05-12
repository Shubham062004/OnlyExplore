import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY, // DO NOT hardcode key
    }),
  ],
  model: 'googleai/gemini-1.5-pro',
});
