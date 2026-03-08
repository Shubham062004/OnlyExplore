# Only Explore 🌍

> The Ultimate AI-powered SaaS Travel Planner and Destination Guide Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.0+-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Stripe](https://img.shields.io/badge/Stripe-Billing-purple.svg)](https://stripe.com/)

## 📖 Overview

Only Explore is a modern, enterprise-ready SaaS travel planning application. It generates personalized itineraries based on user preferences and offers detailed, dynamically generated Destination Guides. Built with Next.js 15, React, TypeScript, and robust AI integrations (via Google Genkit), it features premium content gating, rigorous authentication, and comprehensive infrastructure optimizations.

## ✨ Key Features

### 🤖 AI-Powered Travel System
- **Intelligent Itinerary Generation** - High-quality, tailored travel plans orchestrated by AI.
- **Dynamic Destination Guides** - Auto-generated pages for destinations loaded with activities, hotels, and packing guides.
- **Conversational Trip Planning** - Refine and edit itineraries through natural language chat.
- **Structured JSON Fallbacks** - Resilient processing of complex AI responses with Zod schema validation.

### 🔐 Enterprise-Grade Authentication & Security
- **NextAuth v5 Integration** - Secure JWT-based routing.
- **Multi-method Login** - Google OAuth, Phone (OTP), and Email (OTP/Password) flows.
- **Secure Password Reset** - Full forgot/reset password email loop.
- **Cloudflare Turnstile CAPTCHA** - Advanced bot protection on all public-facing forms.
- **API Rate Limiting** - Integrated connection limits mapped to user IPs to prevent abuse.

### 💳 SaaS Monetization (Stripe Integration)
- **Stripe Checkout & Billing Portal** - Self-serve subscription management.
- **Premium Feature Gating** - Routes and UI seamlessly gate free users (e.g., interactive maps, premium marketplace recommendations).
- **Secure Webhooks** - Automatic synchronization of user subscription status in the database.

### 📡 Third-Party Integrations
- **Maps API (MapBox)** - Interactive maps, distance calculating, and offline map links.
- **Weather API (OpenWeatherMap)** - Real-time destination climate data.
- **Transactional Emails (Resend)** - Fast and reliable email delivery.
- **Transactional SMS (Twilio)** - Global phone verification and OTP delivery.

### 🚀 Performance & SEO
- **Dynamic Server-Side Rendering** - App Router optimizations with Next.js 15 ISR capabilities.
- **Smart Caching** - MongoDB Time-To-Live (TTL) schema indexes serving as an active database caching layer.
- **Automated Sitemaps & Robots.txt** - Dynamically generated `sitemap.xml` exposing destination routes for high-quality SEO.

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** (App Router)
- **React 18**
- **Tailwind CSS** & **Radix UI** (shadcn/ui)
- **React Hook Form** & **Zod**

### Backend & AI
- **Google Genkit** - AI workflow orchestration
- **Node.js & TypeScript**
- **MongoDB & Mongoose** - Document modeling

### Security & DevOps
- **Cloudflare Turnstile** - CAPTCHA alternative
- **Stripe** - Payments & Subscriptions
- **Resend & Twilio** - Communication

## 📁 Project Structure

```
only-explore/
├── src/
│   ├── ai/                # Genkit definitions and structured AI flows
│   ├── app/               # Next.js App Router (pages, dynamic routes, API endpoints)
│   │   ├── api/           # Auth, Chats, Messages, Stripe webhooks, Register
│   │   ├── auth/          # Dedicated Reset & Forgot Password pages
│   │   ├── destination/   # Dynamic Destination Guide routes
│   │   ├── sitemap.ts     # Dynamic SEO generation
│   │   └── robots.ts      # Web crawler configurations
│   ├── components/        # Reusable React UI components
│   ├── lib/               # Utility functions, API integrations, and Database connections
│   │   ├── env.ts         # Strict environment variable validation
│   │   └── stripe.ts      # Stripe instance initialization
│   └── models/            # MongoDB Mongoose schemas (User, Chat, Message, DestinationGuide)
├── .env.example           # Environment variables template
├── tailwind.config.ts
└── next.config.ts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- MongoDB Atlas cluster (or local instance)
- API Keys for Stripe, MapBox, OpenWeatherMap, Twilio, Resend, and Cloudflare Turnstile

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shubham062004/OnlyExplore.git
   cd OnlyExplore
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example environment file and populate it with your specific API keys:
   ```bash
   cp .env.example .env
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

*(Note: The application has built-in startup environment validation. If required API keys are missing, warnings will appear in development, and the app will throw errors restricting failed deployments in production.)*

---

**Made with ❤️ for travelers and developers who love to explore the world!**
