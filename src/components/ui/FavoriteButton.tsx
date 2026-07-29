"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  itemType: "hotel" | "restaurant" | "attraction" | "experience" | "rental";
  itemId: string;
  name: string;
  destination: string;
  metadata?: any;
  isFavorite?: boolean;
  className?: string;
  onToggle?: (isFav: boolean) => void;
}

export function FavoriteButton({
  itemType,
  itemId,
  name,
  destination,
  metadata = {},
  isFavorite = false,
  className = "",
  onToggle,
}: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(isFavorite);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !favorite;
    setFavorite(nextState);
    onToggle?.(nextState);

    try {
      setLoading(true);
      if (nextState) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemType, itemId, name, destination, metadata }),
        });
      } else {
        await fetch(`/api/favorites?itemId=${encodeURIComponent(itemId)}`, {
          method: "DELETE",
        });
      }
    } catch (err) {
      console.warn("⚠️ Favorite API toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all ${
        favorite
          ? "bg-red-500 text-white shadow-lg shadow-red-500/20 scale-105"
          : "bg-black/40 text-white border border-white/20 hover:bg-black/70"
      } ${className}`}
      title={favorite ? "Remove from favorites" : "Save to favorites"}
    >
      <Heart className={`w-4 h-4 ${favorite ? "fill-current" : ""}`} />
    </button>
  );
}
