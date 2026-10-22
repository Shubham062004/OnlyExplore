"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Info, Image, Compass, Zap, Hotel, Utensils, MapPin, Car,
  Sun, CalendarDays, ShieldCheck, ShieldAlert, ArrowUp, TrendingUp,
  ChevronLeft, ChevronRight
} from "lucide-react";

const ALL_NAV_SECTIONS = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "popular-places", label: "Attractions", icon: Compass },
  { id: "hidden-gems", label: "Hidden Gems", icon: Zap },
  { id: "activities", label: "Experiences", icon: Zap },
  { id: "stays", label: "Hotels", icon: Hotel },
  { id: "food-cafes", label: "Food & Cafes", icon: Utensils },
  { id: "nightlife", label: "Nightlife", icon: Utensils },
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
const SCROLL_OFFSET_PADDING = 20;

export function StickyNav() {
  const [activeSection, setActiveSection] = useState("overview");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [visibleSections, setVisibleSections] = useState(ALL_NAV_SECTIONS);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  /**
   * Find the nearest scrollable ancestor.
   * The destination page uses a `div.h-screen.overflow-y-auto` as the scroll
   * container instead of `window`, so we need to target that element directly.
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

  // Dynamically check which sections actually exist in the DOM with content
  useEffect(() => {
    const updateVisibleSections = () => {
      const existing = ALL_NAV_SECTIONS.filter((sec) => {
        if (sec.id === "overview") return true;
        const el = document.getElementById(sec.id);
        // Element must exist and have visible height
        return !!el && el.getBoundingClientRect().height > 20;
      });
      if (existing.length > 0) {
        setVisibleSections(existing);
      }
    };

    updateVisibleSections();

    // Re-check periodically after async sections (guide, images, weather, social pulse) load
    const timer1 = setTimeout(updateVisibleSections, 500);
    const timer2 = setTimeout(updateVisibleSections, 1500);
    const timer3 = setTimeout(updateVisibleSections, 3000);

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
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
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
    const scrollAmount = 260;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  // Back-to-top visibility — listen on both window AND the scroll container
  useEffect(() => {
    const container = getScrollContainer();
    const target = container || window;

    const handleScroll = () => {
      const scrollY = container ? container.scrollTop : window.scrollY;
      setShowBackToTop(scrollY > 400);
    };

    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [getScrollContainer]);

  const isClickScrolling = useRef(false);
  const clickScrollTimer = useRef<NodeJS.Timeout | null>(null);

  // Active section highlighting via IntersectionObserver
  useEffect(() => {
    const container = getScrollContainer();

    const observerOptions: IntersectionObserverInit = {
      root: container || null,
      rootMargin: "-10% 0px -70% 0px",
      threshold: 0,
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      if (isClickScrolling.current) return;

      const intersecting = entries.filter((e) => e.isIntersecting);
      if (intersecting.length === 0) return;

      // Pick the entry closest to the top of the container / sticky nav
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

  // Keep active pill scrolled into view horizontally
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
   * Scroll to a section, compensating for the sticky nav height.
   */
  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Immediately highlight the clicked section
    setActiveSection(id);
    isClickScrolling.current = true;
    if (clickScrollTimer.current) clearTimeout(clickScrollTimer.current);
    clickScrollTimer.current = setTimeout(() => {
      isClickScrolling.current = false;
    }, 1000);

    const container = getScrollContainer();
    const navHeight = navRef.current?.getBoundingClientRect().height ?? 60;

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

  return (
    <>
      {/* Sticky Navigation Bar */}
      <div
        ref={navRef}
        className="sticky top-0 z-30 w-full bg-background/85 backdrop-blur-2xl border-y border-border/50 shadow-md py-2.5 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 relative flex items-center">
          {/* Left Arrow Button */}
          {canScrollLeft && (
            <button
              onClick={() => scrollTrack("left")}
              className="absolute left-1 z-10 w-7 h-7 rounded-full bg-background/90 backdrop-blur-md shadow-md border border-border/60 flex items-center justify-center text-foreground hover:bg-muted transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Horizontal Track */}
          <div
            ref={scrollTrackRef}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 px-1 scroll-smooth"
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
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
                    isActive
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/25 scale-[1.03]"
                      : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground hover:scale-[1.01]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Arrow Button */}
          {canScrollRight && (
            <button
              onClick={() => scrollTrack("right")}
              className="absolute right-1 z-10 w-7 h-7 rounded-full bg-background/90 backdrop-blur-md shadow-md border border-border/60 flex items-center justify-center text-foreground hover:bg-muted transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 w-12 h-12 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
          aria-label="Back to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
