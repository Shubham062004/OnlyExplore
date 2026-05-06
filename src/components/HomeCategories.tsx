"use client";

import { useEffect, useState } from "react";
import { CategorySection } from "./CategorySection";
import { Skeleton } from "./ui/skeleton";

// ─────────────────────────────────────────────────────────────────────────────
// STATIC IMAGE MAP
// Maps destination name → /assets/<slug>.jpg
// Falls back to /assets/default.jpg if image is missing.
// ─────────────────────────────────────────────────────────────────────────────
function getStaticImage(name: string): string {
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  return `/assets/${slug}.jpg`;
}

const FALLBACK_STATIC = "/assets/default.jpg";

// Fallback category data (shown when DB is empty or unreachable)
const FALLBACK_CATEGORIES = [
  {
    name: "Mountains & Hills",
    bestFor: ["Snow", "Trekking", "Cool Weather", "Adventure"],
    items: ["Manali", "Shimla", "Leh Ladakh", "Munnar", "Gangtok", "Rishikesh"],
  },
  {
    name: "Beaches & Islands",
    bestFor: ["Relaxation", "Water Sports", "Sunsets", "Parties"],
    items: ["Goa", "Andaman", "Kochi", "Pondicherry", "Varkala"],
  },
  {
    name: "Heritage & Culture",
    bestFor: ["History", "Architecture", "Spiritual", "Art"],
    items: ["Jaipur", "Udaipur", "Varanasi", "Hampi", "Lucknow", "Agra"],
  },
  {
    name: "Urban Explorations",
    bestFor: ["Food", "Nightlife", "Shopping", "Metros"],
    items: ["Mumbai", "New Delhi", "Bengaluru", "Hyderabad", "Kolkata"],
  },
];

interface Destination {
  name: string;
  image: string;
  slug?: string;
}

interface Category {
  name: string;
  bestFor: string[];
  destinations: Destination[];
}

export function HomeCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/destinations");

        if (res.ok) {
          const data = await res.json();

          // data.categories is a Record<categoryName, [{name, slug, bestFor}]>
          const catMap: Record<string, { name: string; slug: string; bestFor: string[] }[]> =
            data.categories || {};

          // Maintain order via fallback category names
          const orderedNames = [
            "Mountains & Hills",
            "Beaches & Islands",
            "Heritage & Culture",
            "Urban Explorations",
          ];

          const allCategoryNames = Object.keys(catMap);
          const sorted = [
            ...orderedNames.filter((n) => allCategoryNames.includes(n)),
            ...allCategoryNames.filter((n) => !orderedNames.includes(n)),
          ];

          if (sorted.length === 0) throw new Error("No categories from DB");

          const formatted: Category[] = sorted.map((catName) => ({
            name: catName,
            bestFor: catMap[catName][0]?.bestFor || [],
            destinations: catMap[catName].map((d) => ({
              name: d.name,
              slug: d.slug,
              image: getStaticImage(d.name),
            })),
          }));

          setCategories(formatted);
        } else {
          throw new Error("API not ok");
        }
      } catch {
        // Use fallback local data
        const formatted: Category[] = FALLBACK_CATEGORIES.map((cat) => ({
          name: cat.name,
          bestFor: cat.bestFor,
          destinations: cat.items.map((name) => ({
            name,
            image: getStaticImage(name),
          })),
        }));
        setCategories(formatted);
      } finally {
        setLoading(false);
      }
    }

    loadCategories();
  }, []);

  if (loading) {
    return (
      <div className="space-y-12 px-4 mt-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-8 w-64 bg-muted" />
            <Skeleton className="h-4 w-96 bg-muted" />
            <div className="flex gap-6 overflow-hidden">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-48 w-64 shrink-0 rounded-2xl bg-muted" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      {categories.map((cat, idx) => (
        <CategorySection key={idx} category={cat} />
      ))}
    </div>
  );
}
