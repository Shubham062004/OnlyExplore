# Only Explore 🌍

> Your AI-powered travel planner that creates personalized itineraries with Indian Rupee currency support

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)

## 📖 Overview

Only Explore is a modern, AI-powered travel planning application that generates personalized itineraries based on your preferences. Built with React, TypeScript, and advanced AI integration, it provides detailed day-by-day travel plans with realistic Indian pricing in Rupees.

### ✨ Key Features

- 🤖 **AI-Powered Itinerary Generation** - Create personalized travel plans using advanced AI
- 💰 **Indian Rupee Currency Support** - All pricing in INR with proper Indian numbering system
- 🎨 **Beautiful UI/UX** - Modern interface with travel-themed background patterns
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- ✏️ **Real-time Editing** - Modify itineraries through natural language chat
- 📄 **Export Options** - Download PDFs, copy to clipboard, or share itineraries
- 🔧 **Robust JSON Parsing** - Handles malformed AI responses gracefully
- 🌍 **Multi-destination Support** - Plan trips anywhere in the world

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/only-explore.git
   cd only-explore
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=your_api_url_here
   AI_API_KEY=your_ai_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type-safe development
- **Next.js** - Full-stack React framework
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Performant forms with validation
- **Zod** - TypeScript-first schema validation

### Backend & AI
- **Google Genkit** - AI workflow orchestration
- **Node.js** - Server-side runtime
- **TypeScript** - Type-safe backend development

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Lint-staged** - Pre-commit linting

## 📁 Project Structure

```
only-explore/
├── public/
│   ├── images/
│   │   └── travel-pattern.svg    # Travel-themed background pattern
│   └── ...
├── src/
│   ├── ai/
│   │   ├── flows/                # AI workflow definitions
│   │   │   ├── generate-travel-itinerary.ts
│   │   │   ├── edit-travel-itinerary.ts
│   │   │   └── summarize-travel-itinerary.ts
│   │   └── genkit.ts             # AI configuration
│   ├── components/
│   │   ├── ui/                   # Reusable UI components
│   │   └── OnlyExplore.tsx       # Main application component
│   ├── lib/
│   │   └── utils.ts              # Utility functions
│   └── ...
├── .env.example                  # Environment variables template
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 💻 Usage Examples

### Basic Itinerary Generation

1. **Fill out the travel form:**
   - Destination: "Paris, France"
   - Duration: "7 days"
   - Budget: "₹1,50,000"
   - Interests: "food, history, art"

2. **Click "Plan My Trip!"** to generate your itinerary

3. **Review the generated plan** with day-by-day activities and costs

### Editing Itineraries

Use the chat interface at the bottom of the itinerary to make changes:

- "Add a day trip to Versailles"
- "Remove the museum visit on day 3"
- "Change the restaurant recommendation"
- "Increase the budget for day 5"

### Export Options

- **Copy to Clipboard** - Quick sharing via messaging apps
- **Download PDF** - Save for offline reference
- **Share** - Native sharing if supported by browser

---

**Made with ❤️ for travelers who love to explore the world!**
