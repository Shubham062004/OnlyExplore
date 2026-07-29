"use client";

import React, { useState, useEffect } from "react";
import {
  Info, Image, Compass, Zap, Hotel, Utensils, MapPin, Car,
  Sun, CalendarDays, ShieldCheck, ShieldAlert, ArrowUp
} from "lucide-react";

const NAV_SECTIONS = [
  { id: "overview", label: "Overview", icon: Info },
  { id: "gallery", label: "Gallery", icon: Image },
  { id: "popular-places", label: "Attractions", icon: Compass },
  { id: "activities", label: "Experiences", icon: Zap },
  { id: "stays", label: "Hotels", icon: Hotel },
  { id: "map-explorer", label: "Map", icon: MapPin },
  { id: "rentals", label: "Rentals", icon: Car },
  { id: "weather", label: "Weather", icon: Sun },
  { id: "itinerary", label: "Itinerary", icon: CalendarDays },
  { id: "preparation", label: "Packing Guide", icon: ShieldCheck },
  { id: "emergency", label: "Emergency", icon: ShieldAlert },
];

export function StickyNav() {
  const [activeSection, setActiveSection] = useState("overview");
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Active section highlighting via IntersectionObserver
  useEffect(() => {
    const observerOptions = {
      root: null,
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
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-2xl border-b border-border/50 shadow-md py-3 transition-all duration-300">
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
