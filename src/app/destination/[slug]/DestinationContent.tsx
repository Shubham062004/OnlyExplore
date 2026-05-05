"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ImageOff, MapPin } from "lucide-react";
import { PlaceModal } from "@/components/PlaceModal";
import {
  QuickFacts,
  InteractiveMap,
  TripPlannerCTA,
  AdventureActivities,
  StayRecommendations,
  RentalsSection,
  NearbyDestinations,
  TravelTips,
  PackingGuide,
  DestinationSkeleton,
} from "@/components/destination/DestinationComponents";
import { generateDestinationGuide } from "@/ai/flows/generateDestinationGuide";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CachedImages {
  destination: string;
  heroImage: string;
  gallery: string[];
}

interface PlaceInfo {
  name: string;
  description?: string;
  rating?: number;
  tags?: string[];
}

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600&auto=format&fit=crop";

// ─────────────────────────────────────────────────────────────────────────────
// Hero Section
// ─────────────────────────────────────────────────────────────────────────────
function DestinationHero({
  title,
  description,
  heroImage,
}: {
  title: string;
  description: string;
  heroImage: string;
}) {
  const [src, setSrc] = useState(heroImage || FALLBACK_HERO);
  useEffect(() => setSrc(heroImage || FALLBACK_HERO), [heroImage]);

  return (
    <div className="relative w-full h-[480px] md:h-[560px] flex items-end overflow-hidden rounded-b-[2.5rem]">
      {/* Background Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        onError={() => setSrc(FALLBACK_HERO)}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 w-full px-6 md:px-12 pb-12 md:pb-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <MapPin className="w-3 h-3 text-primary" />
            Destination Guide
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-headline text-white drop-shadow-xl leading-none uppercase mb-4">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-zinc-200 max-w-xl font-medium drop-shadow-md">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gallery Section
// ─────────────────────────────────────────────────────────────────────────────
function GallerySection({
  gallery,
  destination,
}: {
  gallery: string[];
  destination: string;
}) {
  const [failedIdx, setFailedIdx] = useState<Set<number>>(new Set());

  if (!gallery || gallery.length === 0) return null;

  return (
    <div className="mt-12 mb-8">
      <h3 className="text-2xl font-bold font-headline mb-6">Photo Gallery</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {gallery.map((src, idx) => {
          const failed = failedIdx.has(idx);
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-2xl bg-muted group cursor-pointer ${
                idx === 0 ? "col-span-2 row-span-2 h-72" : "h-36"
              }`}
            >
              {failed ? (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                  <ImageOff className="w-6 h-6" />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={src}
                  alt={`${destination} gallery ${idx + 1}`}
                  loading="lazy"
                  onError={() =>
                    setFailedIdx((prev) => new Set([...prev, idx]))
                  }
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Popular Places (with modal trigger)
// ─────────────────────────────────────────────────────────────────────────────
function PopularPlacesWithModal({
  places,
  destination,
  placeImages,
  onPlaceClick,
}: {
  places: PlaceInfo[];
  destination: string;
  /** Per-place images from the destination-guide API — index-aligned with places */
  placeImages: string[];
  onPlaceClick: (place: PlaceInfo) => void;
}) {
  if (!places || places.length === 0) return null;

  return (
    <div className="space-y-6 mt-12">
      <div>
        <h3 className="text-2xl font-bold font-headline">Popular Places</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Click any place to explore images and details
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {places.map((place, idx) => {
          // Use the specific image for this place from the guide API
          const imgSrc = (place as any).image || placeImages[idx] || FALLBACK_HERO;
          return (
            <div
              key={idx}
              onClick={() => onPlaceClick(place)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-card border border-border/50"
              role="button"
              tabIndex={0}
              aria-label={`View details for ${place.name}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPlaceClick(place);
                }
              }}
            >
              <div className="relative h-48 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgSrc}
                  alt={place.name}
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = FALLBACK_HERO; }}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* "Click to explore" hint */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    Tap to Explore
                  </span>
                </div>
              </div>

              <div className="p-5 absolute bottom-0 left-0 right-0 text-white">
                <h4 className="font-bold text-lg mb-1 drop-shadow-md leading-tight">
                  {place.name}
                </h4>
                {place.description && (
                  <p className="text-xs text-zinc-200 line-clamp-2 drop-shadow-md font-medium">
                    {place.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main DestinationContent
// ─────────────────────────────────────────────────────────────────────────────
export default function DestinationContent({
  destination,
  session,
}: {
  destination: string;
  session: any;
}) {
  const [guide, setGuide] = useState<any>(null);
  const [images, setImages] = useState<CachedImages | null>(null);
  const [guideApiData, setGuideApiData] = useState<{ heroImage: string; places: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<PlaceInfo | null>(null);

  // Load guide + images
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setImagesLoading(true);

      try {
        // Parallel fetch: AI guide (text) + guide API (places with images) + gallery images
        const [guideData, guideApiRes, imgRes] = await Promise.all([
          generateDestinationGuide(destination),
          fetch(`/api/destination-guide?location=${encodeURIComponent(destination)}`),
          fetch(`/api/destination-images?destination=${encodeURIComponent(destination)}`),
        ]);

        if (!cancelled) {
          setGuide(guideData);
          setLoading(false);
        }

        if (guideApiRes.ok && !cancelled) {
          const guideApiJson = await guideApiRes.json();
          setGuideApiData(guideApiJson);
        }

        if (imgRes.ok && !cancelled) {
          const imgData = await imgRes.json();
          setImages(imgData);
        }
      } catch (error) {
        console.error("Error loading destination data:", error);
        if (!cancelled) setLoading(false);
      } finally {
        if (!cancelled) setImagesLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [destination]);

  const handlePlaceClick = useCallback((place: PlaceInfo) => {
    setSelectedPlace(place);
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  if (loading) return <DestinationSkeleton />;

  if (!guide) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold font-headline mb-4">Content Not Available</h2>
        <p className="text-muted-foreground bg-muted p-4 rounded-xl text-center shadow-inner">
          Unable to generate a travel guide for <b>{destination}</b> at this time.
        </p>
      </div>
    );
  }

  const isPremium = session?.user?.plan === "pro";
  const gallery = images?.gallery || [];
  // Prefer per-place hero from guide API; fall back to gallery hero or static fallback
  const heroImage = guideApiData?.heroImage || images?.heroImage || FALLBACK_HERO;

  // Build place list: merge Genkit guide text with per-place images from the guide API
  const guideApiPlaces: any[] = guideApiData?.places || [];
  const places: PlaceInfo[] = guideApiPlaces.length > 0
    ? guideApiPlaces.map((p: any) => ({
        name: p.name,
        description: p.description,
        image: p.image, // per-place specific image from Unsplash API
      }))
    : (guide.popularPlaces || []).map((p: any) => ({
        name: typeof p === "string" ? p : p.name,
        description: typeof p === "string" ? undefined : p.description,
        rating: typeof p === "string" ? undefined : p.rating,
        tags: typeof p === "string" ? undefined : p.tags,
      }));

  // Per-place image list (index-aligned) for the card grid
  const placeImages: string[] = guideApiPlaces.map((p: any) => p.image || FALLBACK_HERO);

  const activitiesImages: string[] = [];
  const hotelsImages: string[] = [];

  return (
    <div className="w-full pb-12">
      {/* ── 1. Hero ─────────────────────────────────────────────────────────── */}
      <DestinationHero
        title={guide.hero?.title || destination}
        description={
          guide.hero?.description ||
          `Adventure unscripted. Uncover the magic of ${destination}.`
        }
        heroImage={imagesLoading ? FALLBACK_HERO : heroImage}
      />

      <div className="w-full max-w-7xl mx-auto px-4">
        {/* ── 2. Quick Facts ───────────────────────────────────────────────── */}
        {guide.quickFacts && <QuickFacts facts={guide.quickFacts} />}

        {/* ── 3. Gallery ───────────────────────────────────────────────────── */}
        {imagesLoading ? (
          <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground py-12 rounded-2xl bg-muted/30 border">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading gallery images…</span>
          </div>
        ) : (
          <GallerySection gallery={gallery} destination={destination} />
        )}

        {/* ── 4. Interactive Map (Premium) ──────────────────────────────────── */}
        {isPremium && <InteractiveMap destination={destination} />}

        {/* ── 5. Popular Places ────────────────────────────────────────────── */}
        <PopularPlacesWithModal
          places={places}
          destination={destination}
          placeImages={placeImages}
          onPlaceClick={handlePlaceClick}
        />

        {/* ── 6. Trip Planner CTA ───────────────────────────────────────────── */}
        <TripPlannerCTA destination={destination} />

        <div className="w-full">
          {!isPremium && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center my-8 shadow-sm">
              <h3 className="text-xl font-headline font-bold mb-2">
                Unlock the Full Experience
              </h3>
              <p className="text-muted-foreground mb-4">
                Upgrade to Pro to access interactive maps, weather forecasts, curated activities,
                and premium hotel recommendations for {destination}.
              </p>
              <a
                href="/pricing"
                className="inline-block bg-primary text-primary-foreground font-medium px-6 py-2 rounded-full hover:bg-primary/90 transition"
              >
                Upgrade to Pro
              </a>
            </div>
          )}

          {isPremium && (
            <>
              {guide.activities && (
                <AdventureActivities activities={guide.activities} images={activitiesImages} />
              )}
              <StayRecommendations hotels={guide.hotels || []} images={hotelsImages} />
              {guide.rentals && <RentalsSection rentals={guide.rentals} />}
            </>
          )}

          {guide.nearbyDestinations && (
            <NearbyDestinations nearby={guide.nearbyDestinations} images={[]} />
          )}
        </div>

        {/* ── 7. Travel Tips & Packing Guide ───────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 items-stretch">
          {guide.travelTips && <TravelTips tips={guide.travelTips} />}
          {guide.packingGuide && <PackingGuide items={guide.packingGuide} />}
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {selectedPlace && (
        <PlaceModal
          place={selectedPlace}
          city={destination}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
