# Only Explore - AI Travel Planner

Welcome to **Only Explore**, your personal AI-powered travel planner! This application leverages the power of generative AI to create personalized, detailed travel itineraries based on your preferences. Simply provide your destination, trip duration, budget, and interests, and let the AI craft the perfect adventure for you. You can then chat with the AI to make real-time edits to your plan.

![Only Explore Screenshot](https://placehold.co/800x600.png?text=App+Screenshot)

## ✨ Features

- **AI Itinerary Generation**: Get a complete day-by-day travel plan in seconds.
- **Interactive Editing**: Use the chat interface to modify your itinerary on the fly.
- **Budget & Interest-Based Planning**: Itineraries are tailored to your budget and personal interests.
- **PDF Export**: Download your itinerary as a clean, formatted PDF.
- **Share & Copy**: Easily share your travel plans with friends and family.
- **Responsive Design**: Plan your trips on any device, whether desktop or mobile.

## 🚀 Tech Stack

This project is built with a modern, robust tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (with App Router)
- **UI Library**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN/UI](https://ui.shadcn.com/)
- **AI Integration**: [Firebase Genkit](https://firebase.google.com/docs/genkit) with the Google Gemini model
- **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

---

## 🔧 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Install Dependencies

First, navigate to the project directory in your terminal and install the required npm packages.

```bash
npm install
```

### 2. Set Up Your Google AI API Key

This application requires a Google AI (Gemini) API key to function.

- **Get your key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to create and copy your API key.
- **Create the environment file**: In the root of the project, you will find a file named `.env`.
- **Add the key**: Open the `.env` file and add your API key like this:

```
GEMINI_API_KEY="YOUR_API_KEY_HERE"
```

> **Important**: Replace `"YOUR_API_KEY_HERE"` with the actual key you obtained from Google AI Studio.

### 3. Running the Application

This project requires two separate terminal processes to run concurrently: one for the Genkit AI backend and one for the Next.js frontend.

**Terminal 1: Start the Genkit AI Service**

This command starts the Genkit flows, which handle all the communication with the Gemini AI model.

```bash
npm run genkit:dev
```

**Terminal 2: Start the Next.js Frontend**

This command starts the Next.js development server for the user interface.

```bash
npm run dev
```

Once both processes are running, you can access the application in your browser at [http://localhost:9002](http://localhost:9002).

## 📁 Project Structure

Here is a brief overview of the key directories in the project:

- **/src/app/**: Contains the main pages and layout files for the Next.js application.
- **/src/ai/**: Houses all Genkit-related code, including AI flows and prompts.
- **/src/components/**: Contains all React components, including UI components from ShadCN.
- **/src/hooks/**: Custom React hooks used in the application.
- **/src/lib/**: Utility functions and library configurations.

---

Happy travels! ✈️