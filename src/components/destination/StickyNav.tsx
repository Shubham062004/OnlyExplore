"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles, Image, Compass, Zap, Activity, Hotel, Utensils, Moon,
  Car, MapPin, Sun, CalendarDays, ShieldCheck, ShieldAlert,
  ArrowUp, TrendingUp, ChevronLeft, ChevronRight
} from "lucide-react";

interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ALL_NAV_SECTIONS: NavSection[] = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "popular-places", label: "Attractions", icon: Compass },
  { id: "hidden-gems", label: "Hidden Gems", icon: Zap },
  { id: "activities", label: "Experiences", icon: Activity },
  { id: "stays", label: "Hotels", icon: Hotel },
  { id: "food-cafes", label: "Food & Cafes", icon: Utensils },
  { id: "nightlife", label: "Nightlife", icon: Moon },
  { id: "transport", label: "Transport", icon: Car },
  { id: "map-explorer", label: "Map", icon: MapPin },
  { id: "rentals", label: "Rentals", icon: Car },
  { id: "weather", label: "Weather", icon: Sun },
  { id: "social-pulse", label: "Trending", icon: TrendingUp },
  { id: "itinerary", label: "Itinerary", icon: CalendarDays },
  { id: "preparation", label: "Packing Guide", icon: ShieldCheck },
  { id: "emergency", label: "Emergency", icon: ShieldAlert },
];

/** Extra pixels of breathing room below the sticky nav when scrolling to a section */
const SCROLL_OFFSET_PADDING = 36;

export function StickyNav() {
  const [activeSection, setActiveSection] = useState("overview");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visibleSections, setVisibleSections] = useState<NavSection[]>(ALL_NAV_SECTIONS);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const isClickScrolling = useRef(false);
  const clickScrollTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * Find the nearest scrollable ancestor container (Next.js layout uses h-screen overflow-y-auto).
   */
  const getScrollContainer = useCallback((): HTMLElement | null => {
    if (!navRef.current) return null;
    let parent = navRef.current.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }, []);

  // Filter sections dynamically to only those that exist and are rendered in the DOM
  useEffect(() => {
    const updateVisibleSections = () => {
      const existing = ALL_NAV_SECTIONS.filter((sec) => {
        if (sec.id === "overview") return true;
        const el = document.getElementById(sec.id);
        return !!el && el.getBoundingClientRect().height > 20;
      });
      if (existing.length > 0) {
        setVisibleSections(existing);
      }
    };

    updateVisibleSections();
    const timer1 = setTimeout(updateVisibleSections, 600);
    const timer2 = setTimeout(updateVisibleSections, 1800);
    const timer3 = setTimeout(updateVisibleSections, 3500);

    const observer = new MutationObserver(updateVisibleSections);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      observer.disconnect();
    };
  }, []);

  // Update horizontal track scroll arrows
  const checkTrackScroll = useCallback(() => {
    const el = scrollTrackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    checkTrackScroll();
    const el = scrollTrackRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkTrackScroll, { passive: true });
    window.addEventListener("resize", checkTrackScroll);
    return () => {
      el.removeEventListener("scroll", checkTrackScroll);
      window.removeEventListener("resize", checkTrackScroll);
    };
  }, [checkTrackScroll, visibleSections]);

  const scrollTrack = (direction: "left" | "right") => {
    const el = scrollTrackRef.current;
    if (!el) return;
    const scrollAmount = 240;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  // Track page scroll for back-to-top button & subtle elevation change
  useEffect(() => {
    const container = getScrollContainer();
    const target = container || window;

    const handleScroll = () => {
      const scrollY = container ? container.scrollTop : window.scrollY;
      setShowBackToTop(scrollY > 450);
      setIsScrolled(scrollY > 200);
    };

    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [getScrollContainer]);

  // Active section highlighting via IntersectionObserver
  useEffect(() => {
    const container = getScrollContainer();

    const observerOptions: IntersectionObserverInit = {
      root: container || null,
      rootMargin: "-12% 0px -68% 0px",
      threshold: 0,
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      if (isClickScrolling.current) return;

      const intersecting = entries.filter((e) => e.isIntersecting);
      if (intersecting.length === 0) return;

      const closest = intersecting.reduce((prev, curr) => {
        const prevTop = Math.abs(prev.boundingClientRect.top);
        const currTop = Math.abs(curr.boundingClientRect.top);
        return currTop < prevTop ? curr : prev;
      });

      if (closest && closest.target.id) {
        setActiveSection(closest.target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    visibleSections.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [getScrollContainer, visibleSections]);

  // Keep active pill scrolled smoothly into view horizontally
  useEffect(() => {
    const btn = buttonRefs.current.get(activeSection);
    if (btn && scrollTrackRef.current) {
      btn.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest"
      });
    }
  }, [activeSection]);

  /**
   * Smoothly scroll to a target section
   */
  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    setActiveSection(id);
    isClickScrolling.current = true;
    if (clickScrollTimer.current) clearTimeout(clickScrollTimer.current);
    clickScrollTimer.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 1000);

    const container = getScrollContainer();
    const navHeight = navRef.current?.getBoundingClientRect().height ?? 54;

    if (container) {
      const targetTop = el.getBoundingClientRect().top
        - container.getBoundingClientRect().top
        + container.scrollTop
        - navHeight
        - SCROLL_OFFSET_PADDING;

      container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    } else {
      const targetTop =
        el.getBoundingClientRect().top
        + window.scrollY
        - navHeight
        - SCROLL_OFFSET_PADDING;

      window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    }
  }, [getScrollContainer]);

  const scrollToTop = useCallback(() => {
    const container = getScrollContainer();
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [getScrollContainer]);

  // Horizontal wheel handler on desktop
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const track = scrollTrackRef.current;
    if (!track) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && track.scrollWidth > track.clientWidth) {
      track.scrollLeft += e.deltaY;
    }
  };

  // Edge fade gradient mask
  const getMaskStyle = (): React.CSSProperties => {
    if (canScrollLeft && canScrollRight) {
      return {
        maskImage: "linear-gradient(to right, transparent 0%, black 28px, black calc(100% - 28px), transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 28px, black calc(100% - 28px), transparent 100%)",
      };
    }
    if (canScrollLeft) {
      return {
        maskImage: "linear-gradient(to right, transparent 0%, black 28px, black 100%)",
        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 28px, black 100%)",
      };
    }
    if (canScrollRight) {
      return {
        maskImage: "linear-gradient(to right, black 0%, black calc(100% - 28px), transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, black 0%, black calc(100% - 28px), transparent 100%)",
      };
    }
    return {};
  };

  return (
    <>
      {/* Floating Island Capsule Dock */}
      <div className="sticky top-4 sm:top-5 z-30 w-full flex justify-center px-4 my-3 sm:my-4 pointer-events-none transition-all duration-300">
        <div
          ref={navRef}
          className={`pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-white/80 dark:bg-zinc-900/85 backdrop-blur-2xl backdrop-saturate-150 border border-white/80 dark:border-white/10 ring-1 ring-black/[0.04] dark:ring-white/[0.06] transition-all duration-300 max-w-[calc(100vw-2rem)] sm:max-w-4xl lg:max-w-5xl ${
            isScrolled
              ? "shadow-[0_14px_40px_-8px_rgba(0,0,0,0.14),0_4px_16px_-2px_rgba(0,0,0,0.06)] scale-[1.005]"
              : "shadow-[0_10px_30px_-6px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]"
          }`}
        >
          {/* Subtle Left Scroll Button */}
          {canScrollLeft && (
            <button
              onClick={() => scrollTrack("left")}
              className="shrink-0 w-7 h-7 rounded-full bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-700/50 shadow-xs flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all ml-0.5 cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Smooth Scrollable Horizontal Track */}
          <div
            ref={scrollTrackRef}
            style={getMaskStyle()}
            onWheel={onWheel}
            className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0.5 px-2 select-none scroll-smooth"
          >
            {visibleSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  ref={(node) => {
                    if (node) buttonRefs.current.set(sec.id, node);
                    else buttonRefs.current.delete(sec.id);
                  }}
                  onClick={() => scrollToSection(sec.id)}
                  className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 select-none cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-violet-600 via-primary to-indigo-600 text-white shadow-[0_4px_16px_rgba(124,58,237,0.35)] scale-[1.02]"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100/80 dark:hover:bg-zinc-800/60 active:scale-[0.98]"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 stroke-[2] ${
                      isActive
                        ? "text-white scale-110"
                        : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:scale-105"
                    }`}
                  />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Subtle Right Scroll Button */}
          {canScrollRight && (
            <button
              onClick={() => scrollTrack("right")}
              className="shrink-0 w-7 h-7 rounded-full bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-200 border border-zinc-200/50 dark:border-zinc-700/50 shadow-xs flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all mr-0.5"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Glass Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-violet-600 text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 border border-white/20 animate-in fade-in slide-in-from-bottom-4"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-4 h-4 stroke-[2.5]" />
        </button>
      )}
    </>
  );
}

