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
interface GalleryItem {
  url: string;
  label: string;
}

interface GalleryImages {
  heroImage: string;
  gallery: GalleryItem[];
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
    <div className="relative w-full h-[520px] md:h-[640px] flex items-end overflow-hidden rounded-b-[3rem] md:rounded-b-[4rem]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title}
        onError={() => setSrc(FALLBACK_HERO)}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      <div className="relative z-10 w-full px-6 md:px-16 pb-24 md:pb-32">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full mb-6">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            Travel Destination Guide
          </div>
          <h1 className="text-5xl md:text-8xl font-black font-headline text-white drop-shadow-2xl leading-[0.9] uppercase mb-6 tracking-tighter">
            {title}
          </h1>
          <p className="text-lg md:text-2xl text-zinc-200 max-w-2xl font-medium drop-shadow-lg leading-relaxed opacity-90">
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
  gallery: GalleryItem[];
  destination: string;
}) {
  const [failedIdx, setFailedIdx] = useState<Set<number>>(new Set());
  if (!gallery || gallery.length === 0) return null;

  return (
    <div className="mt-20 mb-16">
      <div className="flex flex-col mb-8">
        <h3 className="text-3xl md:text-4xl font-black font-headline uppercase tracking-tighter">Experience Gallery</h3>
        <p className="text-muted-foreground font-medium">A curated visual journey through the best of {destination}.</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {gallery.map((item, idx) => {
          const failed = failedIdx.has(idx);
          return (
            <div
              key={idx}
              className={`relative overflow-hidden rounded-[2rem] bg-muted group cursor-pointer border border-border/50 shadow-xl shadow-black/5 ${
                idx === 0 ? "col-span-2 row-span-2 h-[320px] md:h-[480px]" : "h-[150px] md:h-[230px]"
              }`}
            >
              {failed ? (
                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                  <ImageOff className="w-8 h-8 opacity-20" />
                </div>
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={`${destination} ${item.label}`}
                    loading="lazy"
                    onError={() => setFailedIdx((p) => new Set([...p, idx]))}
                    className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Label Tag */}
                  <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
                    <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full">
                      {item.label}
                    </span>
                  </div>
                </>
              )}
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
        {guide.quickFacts && <QuickFacts facts={guide.quickFacts} destination={destination} />}

        {/* 3. Photo Gallery ────────────────────────────────────────────────── */}
        {galleryLoading ? (
          <div className="mt-12 flex items-center justify-center gap-3 text-muted-foreground py-12 rounded-2xl bg-muted/30 border">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading gallery…</span>
          </div>
        ) : (
          <GallerySection gallery={gallery?.gallery || []} destination={destination} />
        )}

        {/* 4. Map Explorer (Interactive) ─────────────────────────────────────── */}
        {isPremium && <MapExplorer guide={guide} destination={destination} />}

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
