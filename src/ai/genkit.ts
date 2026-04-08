import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY, // DO NOT hardcode key
    }),
  ],
  // gemini-2.5-flash has free tier; gemini-2.0-flash showed quota 0, gemini-1.5-flash 404
  model: 'googleai/gemini-1.5-flash-latest',
});
