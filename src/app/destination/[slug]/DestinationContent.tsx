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
  PopularPlaces,
  ItinerarySection,
} from "@/components/destination/DestinationComponents";
import {
  generateDestinationGuide,
  type DestinationGuideData,
} from "@/ai/flows/generateDestinationGuide";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface GalleryImages {
  heroImage: string;
  gallery: string[];
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        onError={() => setSrc(FALLBACK_HERO)}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

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
// Photo Gallery
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
      <h3 className="text-2xl font-bold font-headline mb-5">Photo Gallery</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {gallery.map((imgSrc, idx) => {
          const failed = failedIdx.has(idx);
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-2xl bg-muted group cursor-pointer ${idx === 0 ? "col-span-2 row-span-2 h-72" : "h-36"
                }`}
            >
              {failed ? (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                  <ImageOff className="w-6 h-6" />
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgSrc}
                  alt={`${destination} gallery ${idx + 1}`}
                  loading="lazy"
                  onError={() => setFailedIdx((p) => new Set([...p, idx]))}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
  const [guide, setGuide] = useState<DestinationGuideData | null>(null);
  const [gallery, setGallery] = useState<GalleryImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setGalleryLoading(true);

      try {
        // Server action (enriched with images) + gallery in parallel
        const [guideData, imgRes] = await Promise.all([
          generateDestinationGuide(destination),
          fetch(`/api/destination-images?destination=${encodeURIComponent(destination)}`),
        ]);

        if (!cancelled) {
          setGuide(guideData);
          setLoading(false);
        }

        if (imgRes.ok && !cancelled) {
          const imgJson = await imgRes.json();
          setGallery(imgJson);
        }
      } catch (err) {
        console.error("Error loading destination data:", err);
        if (!cancelled) setLoading(false);
      } finally {
        if (!cancelled) setGalleryLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [destination]);

  const handlePlaceClick = useCallback((place: any) => setSelectedPlace(place), []);
  const handleModalClose = useCallback(() => setSelectedPlace(null), []);

  if (loading) return <DestinationSkeleton />;

  if (!guide) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold font-headline mb-4">Content Not Available</h2>
        <p className="text-muted-foreground bg-muted p-4 rounded-xl shadow-inner">
          Unable to generate a travel guide for <b>{destination}</b> at this time.
        </p>
      </div>
    );
  }

  const isPremium = session?.user?.plan === "pro";

  // ── Hero: first place image or gallery hero ────────────────────────────────
  const heroImage =
    gallery?.heroImage ||
    guide.popularPlaces?.[0]?.image ||
    FALLBACK_HERO;

  return (
    <div className="w-full pb-12">

      {/* 1. Hero ─────────────────────────────────────────────────────────── */}
      <DestinationHero
        title={guide.hero?.title || destination}
        description={
          guide.hero?.description ||
          `Adventure unscripted. Uncover the magic of ${destination}.`
        }
        heroImage={heroImage}
      />

      <div className="w-full max-w-7xl mx-auto px-4">

        {/* 2. Quick Facts ──────────────────────────────────────────────────── */}
        {guide.quickFacts && <QuickFacts facts={guide.quickFacts} />}

        {/* 3. Photo Gallery ────────────────────────────────────────────────── */}
        {galleryLoading ? (
          <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground py-12 rounded-2xl bg-muted/30 border">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading gallery…</span>
          </div>
        ) : (
          <GallerySection gallery={gallery?.gallery || []} destination={destination} />
        )}

        {/* 4. Interactive Map (Pro only) ───────────────────────────────────── */}
        {isPremium && <InteractiveMap destination={destination} />}

        {/* 5. Popular Places ───────────────────────────────────────────────── */}
        {guide.popularPlaces && (
          <PopularPlaces
            places={guide.popularPlaces}
            destination={destination}
            onPlaceClick={handlePlaceClick}
          />
        )}

        {/* 6. Trip Planner CTA ─────────────────────────────────────────────── */}
        <TripPlannerCTA destination={destination} />

        {/* 7–10. Premium sections ──────────────────────────────────────────── */}
        {!isPremium && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center my-10 shadow-sm">
            <h3 className="text-xl font-headline font-bold mb-2">Unlock the Full Experience</h3>
            <p className="text-muted-foreground mb-4">
              Upgrade to Pro to access interactive maps, curated activities,
              premium hotel recommendations, and day-by-day itineraries for {destination}.
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
            {/* 7. Activities */}
            {guide.activities && guide.activities.length > 0 && (
              <AdventureActivities
                activities={guide.activities}
                destination={destination}
              />
            )}

            {/* 8. Hotels */}
            {guide.hotels && guide.hotels.length > 0 && (
              <StayRecommendations
                hotels={guide.hotels}
                destination={destination}
              />
            )}

            {/* 9. Itinerary */}
            {guide.itinerary && guide.itinerary.length > 0 && (
              <ItinerarySection
                itinerary={guide.itinerary}
                destination={destination}
              />
            )}

            {/* Rentals */}
            {guide.rentals && guide.rentals.length > 0 && (
              <RentalsSection rentals={guide.rentals} />
            )}
          </>
        )}

        {/* Nearby (all users) */}
        {guide.nearbyDestinations && guide.nearbyDestinations.length > 0 && (
          <NearbyDestinations nearby={guide.nearbyDestinations} />
        )}

        {/* 10. Tips + Packing ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 items-stretch">
          {guide.travelTips && <TravelTips tips={guide.travelTips} />}
          {guide.packingGuide && <PackingGuide items={guide.packingGuide} />}
        </div>

      </div>

      {/* Place Modal */}
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
