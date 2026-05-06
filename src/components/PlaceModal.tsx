"use client";

import { useEffect, useState, useCallback } from "react";
import { X, MapPin, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaceModalProps {
  place: {
    name: string;
    description?: string;
    rating?: number;
    tags?: string[];
  };
  city: string;
  onClose: () => void;
}

const FALLBACK_IMGS = [
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?q=80&w=800&auto=format&fit=crop",
];

export function PlaceModal({ place, city, onClose }: PlaceModalProps) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  // Fetch images on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveIdx(0);

    async function fetchImages() {
      try {
        const res = await fetch(
          `/api/place-images?place=${encodeURIComponent(place.name)}&city=${encodeURIComponent(city)}`
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        if (!cancelled) setImages(data.images?.length ? data.images : FALLBACK_IMGS);
      } catch {
        if (!cancelled) setImages(FALLBACK_IMGS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchImages();
    return () => { cancelled = true; };
  }, [place.name, city]);

  // Keyboard: Escape to close, Arrow keys for gallery
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setActiveIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setActiveIdx((i) => (i - 1 + images.length) % images.length);
    },
    [onClose, images.length]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const prev = () => setActiveIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setActiveIdx((i) => (i + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${place.name}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 bg-card border border-border/60 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Image Gallery */}
        <div className="relative w-full h-64 sm:h-80 bg-muted overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Active Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={activeIdx}
                src={images[activeIdx] || FALLBACK_IMGS[0]}
                alt={`${place.name} ${activeIdx + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMGS[0]; }}
                loading="lazy"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={next}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Dot indicators */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === activeIdx ? "bg-white w-5" : "bg-white/50"
                      }`}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {!loading && images.length > 1 && (
          <div className="flex gap-2 px-4 py-3 bg-muted/30 border-b border-border/50 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                  i === activeIdx ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                }`}
                aria-label={`Thumbnail ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMGS[0]; }}
                />
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="text-2xl font-bold font-headline leading-tight">{place.name}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{city}</span>
              </div>
            </div>
            {place.rating && (
              <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full text-sm font-bold shrink-0">
                ★ {place.rating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Tags */}
          {place.tags && place.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {place.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {place.description ||
              `${place.name} is a must-visit destination in ${city}, renowned for its unique charm, vibrant culture, and unforgettable experiences. A perfect addition to any traveler's itinerary.`}
          </p>

          <div className="flex gap-3 mt-6">
            <Button
              className="flex-1 rounded-full font-bold"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${place.name} ${city}`
                  )}`,
                  "_blank"
                )
              }
            >
              <MapPin className="w-4 h-4 mr-1.5" /> View on Map
            </Button>
            <Button variant="outline" className="rounded-full font-bold px-6" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
