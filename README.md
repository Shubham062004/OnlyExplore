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

## 🔧 API Endpoints

### Travel Itinerary Generation

**POST** `/api/generate-itinerary`

**Request Body:**
```json
{
  "destination": "Paris, France",
  "duration": "7 days",
  "budget": "₹1,50,000",
  "interests": ["food", "history", "art"]
}
```

**Response:**
```json
{
  "itinerary": "{\"destination\":\"Paris, France\",\"duration\":7,\"budget\":150000,\"interests\":[\"food\",\"history\",\"art\"],\"days\":[...]}"
}
```

### Edit Itinerary

**POST** `/api/edit-itinerary`

**Request Body:**
```json
{
  "itinerary": "existing_itinerary_json",
  "editRequest": "Add a day trip to Versailles"
}
```

## 🌍 Environment Variables

Create a `.env.local` file in the root directory:

```env
# AI Configuration
AI_API_KEY=your_google_genkit_api_key
GOOGLE_CLOUD_PROJECT_ID=your_project_id

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Currency Configuration
DEFAULT_CURRENCY=INR
CURRENCY_LOCALE=en-IN

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Docker

1. **Build the Docker image:**
   ```bash
   docker build -t only-explore .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 only-explore
   ```

### Manual Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

## 💰 Currency System

The application uses Indian Rupees (INR) with proper Indian numbering system:

### Format Examples
- `₹1,23,456.00` - Indian numbering (lakhs and crores)
- `₹50,000` - Budget display
- `₹2,500 per day` - Daily cost estimates

### Currency Conversion
- Automatic USD to INR conversion using current exchange rates
- Support for multiple currency inputs
- Real-time rate updates

### Implementation
```typescript
// Currency formatting utility
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};
```

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run e2e tests
npm run test:e2e
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### Development Setup

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests:**
   ```bash
   npm run test
   npm run lint
   ```
5. **Commit your changes:**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to your branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### Pull Request Guidelines

- Provide a clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if necessary

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- [Google Genkit](https://genkit.dev/) for AI workflow orchestration
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React Hook Form](https://react-hook-form.com/) for form handling

## 📞 Contact & Support

- **Project Link:** [https://github.com/yourusername/only-explore](https://github.com/yourusername/only-explore)
- **Issues:** [GitHub Issues](https://github.com/yourusername/only-explore/issues)
- **Email:** your.email@example.com
- **Twitter:** [@yourusername](https://twitter.com/yourusername)

## 🗺️ Roadmap

### Upcoming Features
- [ ] Multi-language support
- [ ] Offline mode
- [ ] Advanced filtering options
- [ ] Integration with booking platforms
- [ ] Travel document management
- [ ] Group trip planning
- [ ] Real-time collaboration

### Version History
- **v1.0.0** - Initial release with basic itinerary generation
- **v1.1.0** - Added Indian Rupee currency support
- **v1.2.0** - Enhanced UI with travel patterns and improved UX
- **v1.3.0** - Robust JSON parsing and error handling

---

**Made with ❤️ for travelers who love to explore the world!**