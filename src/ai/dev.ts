import { config } from 'dotenv';
config();

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'REPLACE_WITH_YOUR_API_KEY_HERE') {
  console.error(
    '\n********************************************************************************\n' +
    'ERROR: GEMINI_API_KEY is not set.\n\n' +
    'Please get your key from Google AI Studio (https://aistudio.google.com/app/apikey)\n' +
    'and add it to the .env file in the root of your project.\n\n' +
    'Example .env file:\n' +
    'GEMINI_API_KEY="YOUR_API_KEY_HERE"\n' +
    '********************************************************************************\n'
  );
  process.exit(1);
}

import '@/ai/flows/edit-travel-itinerary.ts';
import '@/ai/flows/summarize-travel-itinerary.ts';
import '@/ai/flows/generate-travel-itinerary.ts';
