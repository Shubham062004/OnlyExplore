"use client";

/**
 * Social Source Badge — Platform and content type badges.
 * Uses platform-specific colors and icons.
 */

import React from "react";
import type { SocialPlatform, SocialContentType } from "@/services/social/socialTypes";

/** Platform display configuration */
const PLATFORM_CONFIG: Record<
  SocialPlatform,
  { label: string; bgClass: string; textClass: string; icon: string }
> = {
  youtube: {
    label: "YouTube",
    bgClass: "bg-red-500/10",
    textClass: "text-red-600",
    icon: "▶",
  },
  unsplash: {
    label: "Unsplash",
    bgClass: "bg-neutral-900/10",
    textClass: "text-neutral-800",
    icon: "📷",
  },
  pexels: {
    label: "Pexels",
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-700",
    icon: "🎬",
  },
  google_places: {
    label: "Google",
    bgClass: "bg-blue-500/10",
    textClass: "text-blue-600",
    icon: "📍",
  },
  instagram: {
    label: "Instagram",
    bgClass: "bg-pink-500/10",
    textClass: "text-pink-600",
    icon: "📸",
  },
  tiktok: {
    label: "TikTok",
    bgClass: "bg-neutral-900/10",
    textClass: "text-neutral-800",
    icon: "🎵",
  },
  pinterest: {
    label: "Pinterest",
    bgClass: "bg-red-600/10",
    textClass: "text-red-700",
    icon: "📌",
  },
};

/** Content type display configuration */
const TYPE_CONFIG: Record<SocialContentType, { label: string; icon: string }> = {
  video: { label: "Video", icon: "🎥" },
  image: { label: "Photo", icon: "📷" },
  reel: { label: "Reel", icon: "🎬" },
  short: { label: "Short", icon: "⚡" },
  post: { label: "Post", icon: "📝" },
  place: { label: "Place", icon: "📍" },
  event: { label: "Event", icon: "🎪" },
};

export function PlatformBadge({ platform }: { platform: SocialPlatform }) {
  const config = PLATFORM_CONFIG[platform] || {
    label: platform,
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    icon: "🔗",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-transparent ${config.bgClass} ${config.textClass}`}
    >
      <span className="text-xs">{config.icon}</span>
      {config.label}
    </span>
  );
}

export function ContentTypeBadge({ type }: { type: SocialContentType }) {
  const config = TYPE_CONFIG[type] || { label: type, icon: "📄" };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
      <span className="text-xs">{config.icon}</span>
      {config.label}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  let colorClass = "bg-muted text-muted-foreground";
  if (score >= 80) colorClass = "bg-emerald-500/10 text-emerald-700";
  else if (score >= 60) colorClass = "bg-amber-500/10 text-amber-700";
  else if (score >= 40) colorClass = "bg-orange-500/10 text-orange-600";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${colorClass}`}
    >
      {score.toFixed(0)}
    </span>
  );
}
