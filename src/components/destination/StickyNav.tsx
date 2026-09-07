"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Info, Image, Compass, Zap, Hotel, Utensils, MapPin, Car,
  Sun, CalendarDays, ShieldCheck, ShieldAlert, ArrowUp, TrendingUp
} from "lucide-react";

const NAV_SECTIONS = [
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
const SCROLL_OFFSET_PADDING = 16;

export function StickyNav() {
  const [activeSection, setActiveSection] = useState("overview");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

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

  // Active section highlighting via IntersectionObserver
  // Use the scroll container as the observer root so rootMargin works correctly
  useEffect(() => {
    const container = getScrollContainer();

    const observerOptions: IntersectionObserverInit = {
      root: container || null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    NAV_SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [getScrollContainer]);

  /**
   * Scroll to a section, compensating for the sticky nav height.
   *
   * We avoid `scrollIntoView({ block: "start" })` because it scrolls the
   * target element flush to the top of the scroll container — directly
   * behind the sticky nav. Instead, we manually compute the scroll offset.
   */
  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const container = getScrollContainer();
    const navHeight = navRef.current?.getBoundingClientRect().height ?? 60;

    if (container) {
      // Manual scroll: target's offsetTop relative to container minus nav height
      const targetTop = el.getBoundingClientRect().top
        - container.getBoundingClientRect().top
        + container.scrollTop
        - navHeight
        - SCROLL_OFFSET_PADDING;

      container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    } else {
      // Fallback: window-level scroll
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
        className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-md py-3 transition-all duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
          {NAV_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 border ${
                  isActive
                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105"
                    : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
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
