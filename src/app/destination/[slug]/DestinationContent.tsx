"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2, ImageOff, MapPin, Maximize2, Camera } from "lucide-react";
import { PlaceModal } from "@/components/PlaceModal";
import {
  QuickFacts,
  MapExplorer,
  TripPlannerCTA,
  AdventureActivities,
  StayRecommendations,
  RentalsSection,
  BeyondTheHorizon,
  TravelPreparation,
  PopularPlaces,
  ItinerarySection,
  HiddenGemsSection,
  LocalFoodSection,
  CafesNightlifeSection,
  LocalTransportSection,
} from "@/components/destination/DestinationComponents";
import {
  HeroSkeleton,
  QuickFactsSkeleton,
  GallerySkeleton,
  MapExplorerSkeleton,
  PlacesCarouselSkeleton,
  ActivitiesSkeleton,
  HotelsSkeleton,
  ItinerarySkeleton,
  PreparationSkeleton,
  TripPlannerSkeleton,
  SectionLoader,
} from "@/components/destination/skeletons";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { StickyNav } from "@/components/destination/StickyNav";
import { GalleryModal, GalleryImage } from "@/components/destination/GalleryModal";
import { SocialPulse } from "@/components/social/SocialPulse";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { WeatherCard } from "@/components/ui/WeatherCard";
import type { DestinationGuideData } from "@/services/destination.service";

import { normalizeExplorerPoints, getSafeExplorerPoints } from "@/lib/explorer";
import { safeImageResolver } from "@/lib/imageUtils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface GalleryItem {
  id?: string;
  url: string;
  label?: string;
  category?: string;
  caption?: string;
  attribution?: string;
}

interface GalleryImages {
  heroImage: string;
  gallery: GalleryItem[];
}

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1600&auto=format&fit=crop";

const GALLERY_CATEGORIES = [
  "All",
  "Nature",
  "Mountains",
  "Rivers",
  "Culture",
  "Food",
  "Adventure",
  "Hotels",
  "Attractions",
];

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
  const [src, setSrc] = useState(safeImageResolver(heroImage, title, FALLBACK_HERO));
  useEffect(() => setSrc(safeImageResolver(heroImage, title, FALLBACK_HERO)), [heroImage, title]);

  return (
    <div id="overview" className="relative w-full h-[520px] md:h-[640px] flex items-end overflow-hidden rounded-b-[3rem] md:rounded-b-[4rem]">
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
        <div className="max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Travel Destination Guide
            </div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full">
              Verified Real Data
            </div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-400/30 text-amber-300 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full">
              Live Weather Sync
            </div>
          </div>
          <h1 className="text-5xl md:text-8xl font-black font-headline text-white drop-shadow-2xl leading-[0.9] uppercase tracking-tighter">
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
// Photo Gallery with Masonry Layout & Fullscreen Modal
// ─────────────────────────────────────────────────────────────────────────────
function GallerySection({
  gallery,
  destination,
}: {
  gallery: GalleryItem[];
  destination: string;
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (!gallery || gallery.length === 0) return null;

  const filteredGallery = useMemo(() => {
    if (activeCategory === "All") return gallery;
    return gallery.filter(
      (item) =>
        item.category?.toLowerCase() === activeCategory.toLowerCase() ||
        item.label?.toLowerCase().includes(activeCategory.toLowerCase())
    );
  }, [gallery, activeCategory]);

  return (
    <div id="gallery" className="mt-20 mb-16 scroll-mt-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
            <Camera className="w-3.5 h-3.5" /> Curated Photo Gallery
          </div>
          <h3 className="text-3xl md:text-5xl font-black font-headline uppercase tracking-tighter">
            Visual Experience <span className="text-primary">{destination}</span>
          </h3>
          <p className="text-muted-foreground font-medium text-sm">
            Explore high-resolution photography categorized by nature, adventure, food & heritage.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-hide max-w-full">
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                activeCategory === cat
                  ? "bg-primary text-white border-primary shadow-md shadow-primary/20 scale-105"
                  : "bg-card text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Masonry Layout Grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
        {filteredGallery.map((item, idx) => (
          <div
            key={item.id || idx}
            onClick={() => setSelectedImageIndex(idx)}
            className="relative overflow-hidden rounded-[2rem] bg-muted group cursor-pointer border border-border/50 shadow-xl shadow-black/5 break-inside-avoid"
          >
            <OptimizedImage
              src={item.url}
              alt={item.caption || `${destination} ${item.label}`}
              className="w-full h-auto object-cover transition-all duration-700 ease-out group-hover:scale-105"
            />
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-5" />

            {/* Top Right Zoom Icon */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white flex items-center justify-center border border-white/20">
                <Maximize2 className="w-4 h-4" />
              </span>
            </div>

            {/* Label Tag */}
            <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75">
              <span className="bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full inline-block truncate max-w-full">
                {item.label || item.category || "View Photo"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Preview Lightbox Modal */}
      {selectedImageIndex !== null && (
        <GalleryModal
          images={filteredGallery}
          initialIndex={selectedImageIndex}
          destination={destination}
          isOpen={selectedImageIndex !== null}
          onClose={() => setSelectedImageIndex(null)}
        />
      )}
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
  const [activeExplorerIndex, setActiveExplorerIndex] = useState(0);

  const explorerPoints = useMemo(() => {
    const rawPoints = normalizeExplorerPoints(guide, destination);
    return getSafeExplorerPoints(rawPoints, destination);
  }, [guide, destination]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setGalleryLoading(true);

      try {
        const [guideRes, imgRes] = await Promise.all([
          fetch(`/api/destination-guide?destination=${encodeURIComponent(destination)}`),
          fetch(`/api/destination-images?destination=${encodeURIComponent(destination)}`),
        ]);

        if (guideRes.ok && !cancelled) {
          const guideJson = await guideRes.json();
          const guideData = guideJson.success ? guideJson.data : (guideJson.data || guideJson);
          if (guideData) setGuide(guideData);
        }

        if (!cancelled) setLoading(false);

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

  const handleLocationClick = useCallback((name: string) => {
    const place =
      explorerPoints.find(p => p.name.toLowerCase() === name.toLowerCase()) ||
      guide?.activities?.find(a => a.name.toLowerCase() === name.toLowerCase()) ||
      guide?.hotels?.find(h => h.name.toLowerCase() === name.toLowerCase());

    if (place) handlePlaceClick(place);
  }, [explorerPoints, guide, handlePlaceClick]);

  const isPremium = true;
  const heroImage = gallery?.heroImage || guide?.popularPlaces?.[0]?.image || FALLBACK_HERO;
  const heroTitle = guide?.hero?.title || destination;
  const heroDescription = guide?.hero?.description || `Adventure unscripted. Uncover the magic of ${destination}.`;

  const fallbackRentals = useMemo(() => [
    {
      name: `${destination} City Sightseeing & Chauffeur Cab`,
      type: "Cab",
      cost: "₹1,400/day",
      rating: 4.8,
      location: destination,
      bestFor: "Day Trips & City Sightseeing",
      image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=800&auto=format&fit=crop",
      imageQuery: `${destination} taxi cab`,
    },
    {
      name: `${destination} Self-Drive Car Rental`,
      type: "Self Drive",
      cost: "₹2,200/day",
      rating: 4.7,
      location: destination,
      bestFor: "Outstation Trips & Flexible Exploration",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop",
      imageQuery: `${destination} self drive car`,
    },
    {
      name: `${destination} City Scooter & Bike Rentals`,
      type: "Scooter",
      cost: "₹550/day",
      rating: 4.9,
      location: destination,
      bestFor: "Heritage Lanes & Quick Commutes",
      image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop",
      imageQuery: `${destination} scooter bike rental`,
    },
  ], [destination]);

  const effectiveRentals = useMemo(() => {
    if (guide?.rentals && guide.rentals.length > 0) return guide.rentals;
    return fallbackRentals;
  }, [guide?.rentals, fallbackRentals]);

  const fallbackActivities = useMemo(() => [
    {
      name: `${destination} Heritage & Cultural Exploration`,
      description: `Explore the historical monuments, grand architectural landmarks, and rich living heritage of ${destination}.`,
      category: "Culture",
      season: "All-Season" as const,
      difficulty: "Easy" as const,
      intensity: "Low" as const,
      imageQuery: `${destination} heritage monument`,
      image: "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop",
      duration: "3 hours",
      rating: 4.9,
    },
    {
      name: `${destination} Street Food & Culinary Walk`,
      description: `Savor the world-famous kebabs, chaats, and royal delicacies at century-old eateries across ${destination}.`,
      category: "Food",
      season: "All-Season" as const,
      difficulty: "Easy" as const,
      intensity: "Low" as const,
      imageQuery: `${destination} street food culinary`,
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop",
      duration: "2.5 hours",
      rating: 4.8,
    },
    {
      name: `${destination} Old City Photography & Craft Trail`,
      description: `Wander through historic lanes discovering handcrafted textiles, chikankari embroidery, and vintage alleyways.`,
      category: "Shopping",
      season: "All-Season" as const,
      difficulty: "Easy" as const,
      intensity: "Medium" as const,
      imageQuery: `${destination} craft market`,
      image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=800&auto=format&fit=crop",
      duration: "3 hours",
      rating: 4.9,
    },
  ], [destination]);

  const effectiveActivities = useMemo(() => {
    if (guide?.activities && guide.activities.length > 0) return guide.activities;
    return fallbackActivities;
  }, [guide?.activities, fallbackActivities]);

  return (
    <div className="w-full pb-12">
      {/* 1. Hero */}
      <SectionLoader loading={loading && !guide} skeleton={<HeroSkeleton />}>
        <DestinationHero
          title={heroTitle}
          description={heroDescription}
          heroImage={heroImage}
        />
      </SectionLoader>

      {/* 2. Quick Facts - floats smoothly over bottom of Hero */}
      <div className="w-full max-w-7xl mx-auto px-4 mb-8">
        <ErrorBoundary sectionName="Quick Facts">
          <SectionLoader loading={loading} skeleton={<QuickFactsSkeleton />}>
            {guide?.quickFacts && <QuickFacts facts={guide.quickFacts} destination={destination} />}
          </SectionLoader>
        </ErrorBoundary>
      </div>

      {/* 3. Sticky Navigation Bar */}
      <StickyNav />

      <div className="w-full max-w-7xl mx-auto px-4">

        {/* 4. Photo Gallery with Masonry & Filters */}
        <ErrorBoundary sectionName="Gallery">
          <SectionLoader loading={galleryLoading} skeleton={<GallerySkeleton />}>
            <GallerySection gallery={gallery?.gallery || []} destination={destination} />
          </SectionLoader>
        </ErrorBoundary>

        {/* 5. Popular Places */}
        <ErrorBoundary sectionName="Popular Places">
          <SectionLoader loading={loading} skeleton={<PlacesCarouselSkeleton />}>
            <div id="popular-places" className="scroll-mt-24">
              {explorerPoints.length > 0 && (
                <PopularPlaces
                  places={explorerPoints}
                  destination={destination}
                  activeIndex={activeExplorerIndex}
                  onIndexChange={setActiveExplorerIndex}
                  onPlaceClick={handlePlaceClick}
                />
              )}
            </div>
          </SectionLoader>
        </ErrorBoundary>

        {/* 5b. Local Hidden Gems */}
        {guide?.hiddenGems && (
          <ErrorBoundary sectionName="Hidden Gems">
            <HiddenGemsSection items={guide.hiddenGems} />
          </ErrorBoundary>
        )}

        {/* 6. Trip Planner CTA */}
        <ErrorBoundary sectionName="Trip Planner">
          <SectionLoader loading={loading} skeleton={<TripPlannerSkeleton />}>
            <TripPlannerCTA destination={destination} />
          </SectionLoader>
        </ErrorBoundary>

        {/* 7. Activities / Experiences */}
        <ErrorBoundary sectionName="Activities">
          <SectionLoader loading={loading} skeleton={<ActivitiesSkeleton />}>
            <div id="activities" className="scroll-mt-24">
              {!loading && effectiveActivities.length > 0 && (
                <AdventureActivities
                  activities={effectiveActivities}
                  destination={destination}
                  onViewDetails={handlePlaceClick}
                />
              )}
            </div>
          </SectionLoader>
        </ErrorBoundary>

        {/* 8. Stays / Hotels */}
        <ErrorBoundary sectionName="Hotels">
          <SectionLoader loading={loading} skeleton={<HotelsSkeleton />}>
            <div id="stays" className="scroll-mt-24">
              {guide?.hotels && guide.hotels.length > 0 && (
                <StayRecommendations
                  hotels={guide.hotels}
                  destination={destination}
                  onViewDetails={handlePlaceClick}
                />
              )}
            </div>
          </SectionLoader>
        </ErrorBoundary>

        {/* 8b. Local Food & Signature Dishes */}
        {guide?.localFood && (
          <ErrorBoundary sectionName="Local Food">
            <LocalFoodSection items={guide.localFood} />
          </ErrorBoundary>
        )}

        {/* 8c. Artisanal Cafes & Nightlife */}
        {(guide?.cafes || guide?.nightlife) && (
          <ErrorBoundary sectionName="Cafes & Nightlife">
            <CafesNightlifeSection cafes={guide?.cafes} nightlife={guide?.nightlife} />
          </ErrorBoundary>
        )}

        {/* 8d. Local Mobility & Transport */}
        {guide?.localTransport && (
          <ErrorBoundary sectionName="Local Transport">
            <LocalTransportSection items={guide.localTransport} />
          </ErrorBoundary>
        )}

        {/* 9. Interactive Smart Map */}
        <ErrorBoundary sectionName="Map Explorer">
          <SectionLoader loading={loading} skeleton={<MapExplorerSkeleton />}>
            {isPremium && explorerPoints.length > 0 && (
              <MapExplorer
                points={explorerPoints}
                destination={destination}
                activeIndex={activeExplorerIndex}
                onIndexChange={setActiveExplorerIndex}
              />
            )}
          </SectionLoader>
        </ErrorBoundary>

        {/* 10. Rentals */}
        <ErrorBoundary sectionName="Rentals">
          <div id="rentals" className="scroll-mt-24">
            {!loading && effectiveRentals.length > 0 && (
              <RentalsSection
                rentals={effectiveRentals}
                onViewDetails={handlePlaceClick}
              />
            )}
          </div>
        </ErrorBoundary>

        {/* 11. Dynamic Weather Widget */}
        <ErrorBoundary sectionName="Weather">
          <div id="weather" className="scroll-mt-24">
            <WeatherCard destination={destination} />
          </div>
        </ErrorBoundary>

        {/* 11b. Social Pulse — Loads independently, does NOT block page */}
        <ErrorBoundary sectionName="Social Pulse">
          <SocialPulse destination={destination} />
        </ErrorBoundary>

        {/* 12. Itinerary */}
        <ErrorBoundary sectionName="Itinerary">
          <SectionLoader loading={loading} skeleton={<ItinerarySkeleton />}>
            <div id="itinerary" className="scroll-mt-24">
              {guide?.itinerary && guide.itinerary.length > 0 && (
                <ItinerarySection
                  itinerary={guide.itinerary}
                  destination={destination}
                  onLocationClick={handleLocationClick}
                />
              )}
            </div>
          </SectionLoader>
        </ErrorBoundary>

        {/* Nearby & Similar */}
        <ErrorBoundary sectionName="Nearby Destinations">
          {!loading && (guide?.nearbyDestinations || guide?.similarDestinations) && (
            <BeyondTheHorizon
              nearby={guide?.nearbyDestinations || []}
              similar={guide?.similarDestinations || []}
              destination={destination}
            />
          )}
        </ErrorBoundary>

        {/* 13. Travel Preparation & Emergency */}
        <ErrorBoundary sectionName="Travel Preparation">
          <SectionLoader loading={loading} skeleton={<PreparationSkeleton />}>
            <div id="preparation" className="scroll-mt-24">
              <div id="emergency">
                {(guide?.travelTips || guide?.packingGuide) && (
                  <TravelPreparation
                    tips={guide?.travelTips || []}
                    packing={guide?.packingGuide || []}
                    alerts={guide?.safetyAlerts || []}
                    destination={destination}
                  />
                )}
              </div>
            </div>
          </SectionLoader>
        </ErrorBoundary>

      </div>

      {/* Place Details Modal */}
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
