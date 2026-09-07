"use client";

/**
 * Social Pulse Skeleton — Loading state for the Social Pulse section.
 * Matches the real layout to prevent CLS (Cumulative Layout Shift).
 * Uses the same Shimmer pattern as existing OnlyExplore skeletons.
 */

import React from "react";

function Shimmer({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] rounded-xl ${className}`}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card rounded-[2rem] border border-border/50 shadow-xl shadow-black/5 overflow-hidden min-w-[280px] max-w-[320px] flex-shrink-0">
      {/* Thumbnail */}
      <Shimmer className="w-full h-44 rounded-none rounded-t-[2rem]" />
      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Platform badge */}
        <div className="flex items-center gap-2">
          <Shimmer className="h-5 w-16 rounded-full" />
          <Shimmer className="h-5 w-12 rounded-full" />
        </div>
        {/* Title */}
        <Shimmer className="h-5 w-full" />
        <Shimmer className="h-4 w-3/4" />
        {/* Author */}
        <Shimmer className="h-4 w-1/2" />
        {/* Metrics */}
        <div className="flex items-center gap-3 pt-1">
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function SocialPulseSkeleton() {
  return (
    <div id="social-pulse" className="mt-20 mb-16 scroll-mt-24">
      {/* Header */}
      <div className="space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
          <span className="text-sm">🔥</span> Social Pulse
        </div>
        <Shimmer className="h-10 w-80 rounded-xl" />
        <p className="text-muted-foreground font-medium text-sm animate-pulse">
          Finding what&apos;s trending...
        </p>
      </div>

      {/* Cards */}
      <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
