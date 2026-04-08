"use client";

import { useEffect, useState } from "react";
import { CategorySection } from "./CategorySection";
import { Skeleton } from "./ui/skeleton";

const categoryData = [
  {
    name: "Mountains & Hills",
    bestFor: ["Snow", "Trekking", "Cool Weather", "Adventure"],
    items: [
      { name: "Manali", query: "Manali snow mountains India" },
      { name: "Shimla", query: "Shimla hill station India heritage" },
      { name: "Leh Ladakh", query: "Leh Ladakh mountains road trip" },
      { name: "Munnar", query: "Munnar tea gardens hills" },
      { name: "Gangtok", query: "Gangtok himalayas view" }
    ]
  },
  {
    name: "Beaches & Islands",
    bestFor: ["Relaxation", "Water Sports", "Sunsets", "Parties"],
    items: [
      { name: "Goa", query: "Goa beach sunset tropical" },
      { name: "Andaman", query: "Andaman islands turquoise water" },
      { name: "Kochi", query: "Kochi fort beaches backwaters" },
      { name: "Pondicherry", query: "Pondicherry french quarter beach" },
      { name: "Varkala", query: "Varkala cliff beach" }
    ]
  },
  {
    name: "Heritage & Culture",
    bestFor: ["History", "Architecture", "Spiritual", "Art"],
    items: [
      { name: "Jaipur", query: "Jaipur pink city fort" },
      { name: "Udaipur", query: "Udaipur lake palace sunset" },
      { name: "Varanasi", query: "Varanasi ghats ceremony" },
      { name: "Hampi", query: "Hampi ruins boulders temples" },
      { name: "Lucknow", query: "Lucknow imambara heritage" }
    ]
  },
  {
    name: "Urban Explorations",
    bestFor: ["Food", "Nightlife", "Shopping", "Metros"],
    items: [
      { name: "Mumbai", query: "Mumbai marine drive skyline" },
      { name: "New Delhi", query: "Delhi monument red fort" },
      { name: "Bengaluru", query: "Bangalore city park nightlife" },
      { name: "Hyderabad", query: "Hyderabad charminar biryani" },
      { name: "Kolkata", query: "Kolkata victoria memorial city" }
    ]
  }
];

export function HomeCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAllImages() {
      try {
        setLoading(true);
        
        // Prepare the new structure with images
        const updatedCategories = await Promise.all(categoryData.map(async (cat) => {
          const destinationsWithImages = await Promise.all(cat.items.map(async (item) => {
            // We fetch a single image for each destination from our new Unsplash service
            // Using search for specific keywords to get the best match
            const res = await fetch(`/api/city-images?city=${encodeURIComponent(item.query)}`);
            const data = await res.json();
            return {
              name: item.name,
              image: data.hero || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=1000&auto=format&fit=crop`
            };
          }));
          
          return {
            ...cat,
            destinations: destinationsWithImages
          };
        }));

        setCategories(updatedCategories);
      } catch (error) {
        console.error("Failed to fetch category images:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAllImages();
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
