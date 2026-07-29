import { NextRequest, NextResponse } from "next/server";
import { DestinationService } from "@/services/destination.service";
import { cacheService } from "@/services/cache.service";
import { ai } from "@/ai/genkit";
import { z } from "genkit";

const RecommendationInputSchema = z.object({
  destination: z.string(),
  budget: z.string().optional(),
  duration: z.string().optional(),
  interests: z.string().optional(),
  groupSize: z.string().optional(),
});

/**
 * ⚡ EXPERIENCES & ACTIVITIES API
 * Fetches curated destination-specific experiences with category filters, deduplication,
 * and optional Gemini AI personalized recommendation.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get("destination") || "Manali";
  const category = searchParams.get("category") || "All";
  const budget = searchParams.get("budget") || "";
  const duration = searchParams.get("duration") || "";
  const interests = searchParams.get("interests") || "";
  const groupSize = searchParams.get("groupSize") || "";

  const cacheKey = `experiences:${destination.toLowerCase().trim()}:${category.toLowerCase()}`;

  try {
    let cached = await cacheService.get<any>(cacheKey);

    if (!cached) {
      const guide = await DestinationService.generateDestinationGuide(destination);
      let activities = guide?.activities || [];

      // Ensure rich experience dataset
      if (activities.length < 5) {
        activities = [
          {
            name: `${destination} Sunset River Rafting & Camping`,
            category: "Adventure",
            image: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?q=80&w=1000&auto=format&fit=crop",
            duration: "4 Hours",
            price: "₹1,800 / person",
            difficulty: "Moderate",
            bestTime: "Late Afternoon (03:00 PM)",
            suitableFor: ["Friends", "Couples", "Adventure Enthusiasts"],
            rating: 4.9,
            reviewsCount: 142,
            description: `Experience adrenaline-pumping rapids along scenic riverbanks in ${destination}, followed by bonfire evening.`,
          },
          {
            name: `Guided Heritage Walk & Food Tasting in ${destination}`,
            category: "Culture",
            image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop",
            duration: "3 Hours",
            price: "₹950 / person",
            difficulty: "Easy",
            bestTime: "Morning (10:00 AM)",
            suitableFor: ["Family", "Solo", "Foodies"],
            rating: 4.8,
            reviewsCount: 210,
            description: `Sample authentic regional delicacies and visit ancient wooden architecture and local artisan bazaars in ${destination}.`,
          },
          {
            name: `Panoramic Peak Trek & Sunrise Photography`,
            category: "Trekking",
            image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1000&auto=format&fit=crop",
            duration: "6 Hours",
            price: "₹2,400 / person",
            difficulty: "Challenging",
            bestTime: "Early Morning (04:30 AM)",
            suitableFor: ["Solo Trekkers", "Photographers", "Fit Travelers"],
            rating: 4.9,
            reviewsCount: 98,
            description: `Guided alpine trail ascent to breathtaking panoramic viewpoints over ${destination} valley.`,
          },
          {
            name: `Spiritual Sanctuary & Meditation Retreat`,
            category: "Spiritual",
            image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1000&auto=format&fit=crop",
            duration: "2.5 Hours",
            price: "₹600 / person",
            difficulty: "Easy",
            bestTime: "Morning (08:00 AM)",
            suitableFor: ["All Travelers", "Peace Seekers"],
            rating: 4.7,
            reviewsCount: 175,
            description: `Immerse in tranquility at historic temple sanctuaries surrounded by cedar groves in ${destination}.`,
          },
          {
            name: `Stargazing & Overnight Wilderness Camping`,
            category: "Camping",
            image: "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?q=80&w=1000&auto=format&fit=crop",
            duration: "Overnight (18 Hours)",
            price: "₹3,200 / person",
            difficulty: "Moderate",
            bestTime: "Overnight",
            suitableFor: ["Couples", "Small Groups"],
            rating: 4.95,
            reviewsCount: 310,
            description: `Clear night sky observation with high-powered telescopes, tent accommodation, and campfire barbecue.`,
          },
        ] as any;
      }

      cached = activities.map((act: any, idx: number) => ({
        id: `exp-${idx}-${(act.name || "exp").toLowerCase().replace(/\s+/g, "-")}`,
        name: act.name,
        category: act.category || "Adventure",
        images: act.images || [act.image || "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?q=80&w=1000&auto=format&fit=crop"],
        duration: act.duration || "3-4 Hours",
        price: act.price || "₹1,500 / person",
        difficulty: act.difficulty || "Easy to Moderate",
        bestTime: act.bestTime || act.season || "Morning / Afternoon",
        suitableFor: act.suitableFor || act.bestFor || ["All Travelers"],
        rating: Math.min(5, Math.max(4, parseFloat(act.rating) || 4.8)),
        reviewsCount: act.reviewsCount || Math.floor(80 + idx * 37),
        description: act.description || `Unforgettable ${act.category || "experience"} in ${destination}.`,
      }));

      await cacheService.set(cacheKey, cached, 60 * 60);
    }

    let filtered = [...cached];

    // Filter by Category
    if (category !== "All") {
      filtered = filtered.filter(
        (e: any) =>
          e.category.toLowerCase().includes(category.toLowerCase()) ||
          e.name.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Deduplicate by name
    const seen = new Set();
    const deduplicated = filtered.filter((e: any) => {
      const key = e.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Optional Gemini Personalization if criteria provided
    let aiRecommendation: string | null = null;

    if (budget || duration || interests || groupSize) {
      try {
        const prompt = `Given a traveler to ${destination} with: Budget=${budget}, Duration=${duration}, Interests=${interests}, GroupSize=${groupSize}.
Recommend 2 top experiences from this list: ${JSON.stringify(deduplicated.map(d => d.name))}. Keep recommendation brief (2 sentences).`;
        const res = await ai.generate({
          prompt,
        });
        aiRecommendation = res.text || null;
      } catch (err) {
        console.warn("⚠️ AI Recommendation prompt skipped:", err);
      }
    }

    return NextResponse.json({
      success: true,
      destination,
      category,
      aiRecommendation,
      total: deduplicated.length,
      data: deduplicated,
    });
  } catch (error: any) {
    console.error("❌ Experiences API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch experiences" },
      { status: 500 }
    );
  }
}
