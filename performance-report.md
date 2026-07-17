# OnlyExplore Performance Audit & Bottleneck Analysis Report

This report analyzes the existing OnlyExplore codebase and identifies critical architectural bottlenecks, sequential API waterfalls, database queries, and rendering issues causing slow response times (10–20 seconds).

---

## 1. Executive Summary
- **Current Latency:** 10–20 seconds for a fresh destination/itinerary request.
- **Target Latency:** 
  - First request (cache miss): < 3 seconds
  - Cached request: < 500ms
- **Primary Causes of Latency:**
  1. **Sequential API Waterfalls:** Multiple Google Places and Directions APIs are fetched sequentially, especially inside nested loops during travel time calculation.
  2. **Uncached Heavy Operations:** Unsplash image searches, AI prompt synthesis, weather queries, and map geocoding are executed repeatedly without durable caching.
  3. **AI Prompt Redundancy:** Prompts are sent to Gemini for identical inputs without hashing and caching results.
  4. **Next.js Prerendering Failures:** Missing `<Suspense>` wrappers around `useSearchParams()` client components prevent compilation/build completion.
  5. **Mongoose warnings & build issues:** Duplicate indices on models.

---

## 2. API Route & Server Action Bottleneck Analysis

### A. Destination Guide Generation (`src/ai/flows/generateDestinationGuide.ts`)
The destination guide flow is the heaviest operation. It runs through five sequential stages:
1. **Brainstorming (Gemini 1.5 Pro):** Takes **2-4s** to generate a raw lists of landmarks, hotels, rentals, etc.
2. **Google Places Search:** Takes **1-2s**. While it wraps requests in `Promise.all`, it fetches 38 distinct places in parallel, which is extremely heavy and susceptible to Google Maps API rate limits.
3. **Distance Matrix calculations:** Takes **500ms-1s** in parallel.
4. **Sentiment / Review extraction:** Fetches place details for 5 spots in parallel (**500ms**).
5. **Synthesis (Gemini 1.5 Pro):** Takes **3-5s** to compile the structured JSON guide.
6. **Waterfall Travel Info Loop (CRITICAL BOTTLENECK):**
   ```typescript
   for (const day of output.itinerary) {
     if (day.schedule && day.schedule.length > 1) {
       for (let i = 0; i < day.schedule.length - 1; i++) {
         const travel = await DestinationService.getTravelInfo(...); // Sequential execution!
       }
     }
   }
   ```
   For a 3-day itinerary, this executes **6-10 sequential Google Directions API calls**. At **300ms** per call, this loop alone wastes **2-3 seconds** blocking the thread.
7. **Image Enrichment (Unsplash Bulk fetch):** Takes **1-2s** to execute 6 Unsplash searches in parallel on every guide generation, which easily exceeds Unsplash demo rate limits (50 requests/hour).

### B. Travel Itinerary Flow (`src/ai/flows/generate-travel-itinerary.ts`)
- Calls `getWeatherForDestination` (OpenWeatherMap API) and `getCoordinates` (Mapbox API) sequentially if `plan === 'pro'`, followed by a Gemini generation flow, followed by Unsplash image fetches.
- **Latency:** **5-10s** due to sequential flow execution.

---

## 3. Database & Caching Audit

### A. Database Bottlenecks (`src/models/` & `src/lib/mongodb.ts`)
- **No Durable Cache:** Only a short-lived, rolling 15-minute cache is implemented in MongoDB for guides and images.
- **Connection Overhead:** MongoDB connects on demand, which is optimized using standard cache properties but can block initial requests.
- **Duplicate Indexes:** Mongoose raises warnings during prerendering about duplicate indices defined on `User` (email, phone) and `DestinationGuide` (destination).

### B. Caching Limitations
- **No Redis Cache:** Absolutely no Redis layer is configured.
- **No Prompt/AI Cache:** Identical LLM requests (same destination, duration, budget, style) are sent to Gemini repeatedly, costing tokens and time.

---

## 4. Frontend & Rendering Audit

### A. Prerender & Build Failures
- **CSR/Suspense Bailout:** `OnlyExplore.tsx` calls `useSearchParams()`. Next.js bails out of static generation during `next build` because `OnlyExplore` is imported and rendered directly in:
  - `src/app/[chatId]/page.tsx`
  - `src/app/destination/chat/[chatId]/page.tsx`
  without `<Suspense>` wrappers. This causes compilation builds to crash.

### B. Image Performance
- Image rendering does not utilize responsive dimensions, WebP transformations, or CDN caching, causing high page weight and slow page load times.

---

## 5. Summary of Measures

| Feature / Operation | Current Performance / Latency | Bottleneck Type | Refactored Strategy | Target Performance |
| :--- | :--- | :--- | :--- | :--- |
| **Itinerary Generation** | 10-15 seconds | Parallelism & LLM latency | Hash prompts, Parallelize dependencies, cache in Redis/Mongo | < 3s (Miss), < 500ms (Hit) |
| **Destination Guide** | 12-20 seconds | Waterfall API loops & synthesis | Parallelize schedule travel times, Cache in Redis + Mongo | < 3s (Miss), < 500ms (Hit) |
| **Image Loading** | Slow (raw Unsplash URLs) | Repeated API calls, huge payloads | CDN URLs (WebP / format parameters), Next.js Image caching | Immediate |
| **Build Stability** | Fails compilation | Suspense compilation bailout | Wrap page client components in React Suspense | Compiles successfully |
