"use client";

/**
 * Social Pulse — Main Container Component
 *
 * Architecture:
 * - Loads INDEPENDENTLY from the destination page (does NOT block page load)
 * - Shows skeleton while loading
 * - Gracefully handles errors ("Social Pulse is temporarily unavailable")
 * - Progressive rendering of content cards
 * - Horizontal scroll carousel for content cards
 *
 * Design: OnlyExplore design system — white bg, soft purple accents,
 * fire emoji for trending, rounded cards.
 */

import React, { useEffect, useState, useCallback } from "react";
import { TrendingUp, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { SocialContentCard } from "./SocialContentCard";
import { SocialPulseSkeleton } from "./SocialPulseSkeleton";
import type { SocialPulseResponse, NormalizedSocialContent } from "@/services/social/socialTypes";

interface SocialPulseProps {
  destination: string;
}

export function SocialPulse({ destination }: SocialPulseProps) {
  const [data, setData] = useState<SocialPulseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const fetchSocialPulse = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/social/trending?destination=${encodeURIComponent(destination)}`,
        { signal: AbortSignal.timeout(15000) }
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const json: SocialPulseResponse = await res.json();
      setData(json);

      if (!json.success && json.error) {
        setError(json.error);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.name === 'TimeoutError') {
        setError("Social Pulse took too long to load. Please try again.");
      } else {
        setError("Social Pulse is temporarily unavailable.");
      }
      console.warn("[SocialPulse] Fetch failed:", err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [destination]);

  useEffect(() => {
    fetchSocialPulse();
  }, [fetchSocialPulse]);

  // Carousel scroll handlers
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = 320; // ~card width + gap
    const newPosition =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;
    container.scrollTo({ left: newPosition, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollPosition(scrollContainerRef.current.scrollLeft);
    }
  };

  // ── Loading State ───────────────────────────────────────────────────────
  if (loading) {
    return <SocialPulseSkeleton />;
  }

  // ── Error State ─────────────────────────────────────────────────────────
  if (error && (!data || data.items.length === 0)) {
    return (
      <div id="social-pulse" className="mt-20 mb-16 scroll-mt-24">
        <div className="space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
            <span className="text-sm">🔥</span> Social Pulse
          </div>
          <h3 className="text-3xl md:text-5xl font-black font-headline uppercase tracking-tighter">
            Trending in{" "}
            <span className="text-primary">{destination}</span>
          </h3>
        </div>

        <div className="bg-card rounded-[2rem] border border-border/50 p-8 flex flex-col items-center gap-4 text-center">
          <AlertCircle className="w-10 h-10 text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium text-sm">{error}</p>
          <button
            onClick={fetchSocialPulse}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all duration-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Empty State ─────────────────────────────────────────────────────────
  if (!data || data.items.length === 0) {
    return null; // Don't render anything if no data and no error
  }

  // ── Success State ───────────────────────────────────────────────────────
  const items = data.items;
  const canScrollLeft = scrollPosition > 0;
  const canScrollRight =
    scrollContainerRef.current
      ? scrollPosition <
        scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth - 10
      : true;

  // Group active provider names for display
  const activeProviders = data.providers
    .filter((p) => p.status === "success" && p.resultCount > 0)
    .map((p) => p.name);

  return (
    <div id="social-pulse" className="mt-20 mb-16 scroll-mt-24">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
            <span className="text-sm">🔥</span> Social Pulse
          </div>
          <h3 className="text-3xl md:text-5xl font-black font-headline uppercase tracking-tighter">
            Trending in{" "}
            <span className="text-primary">{destination}</span>
          </h3>
          <p className="text-muted-foreground font-medium text-sm">
            Curated content from{" "}
            {activeProviders.length > 0
              ? activeProviders.join(", ")
              : "verified sources"}
            {data.cached && (
              <span className="ml-2 text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                • cached
              </span>
            )}
          </p>
        </div>

        {/* Scroll controls */}
        {items.length > 3 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollBy("left")}
              disabled={!canScrollLeft}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                canScrollLeft
                  ? "border-border bg-card hover:bg-primary hover:text-white hover:border-primary shadow-md"
                  : "border-border/30 bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
              }`}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollBy("right")}
              disabled={!canScrollRight}
              className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${
                canScrollRight
                  ? "border-border bg-card hover:bg-primary hover:text-white hover:border-primary shadow-md"
                  : "border-border/30 bg-muted/30 text-muted-foreground/30 cursor-not-allowed"
              }`}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Cards Carousel ────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
      >
        {items.map((item) => (
          <SocialContentCard key={item.id} item={item} />
        ))}
      </div>

      {/* ── Footer Info ───────────────────────────────────────────────── */}
      <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground/50 uppercase tracking-wider">
        <span>
          {data.totalResults} results • Powered by official APIs
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Updated {data.cached ? "from cache" : "just now"}
        </span>
      </div>
    </div>
  );
}
