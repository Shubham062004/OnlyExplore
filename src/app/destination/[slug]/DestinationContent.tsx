"use client";

import { useEffect, useState } from "react";
import { 
  DestinationHero, QuickFacts, PopularPlaces, InteractiveMap, 
  AdventureActivities, StayRecommendations, TripPlannerCTA, 
  RentalsSection, NearbyDestinations, TravelTips, PackingGuide,
  DestinationSkeleton
} from "@/components/destination/DestinationComponents";
import { generateDestinationGuide } from "@/ai/flows/generateDestinationGuide";

interface UnsplashImage {
  id: string;
  url: string;
  thumb: string;
  alt: string;
}

interface CityImages {
  hero: string | null;
  places: string[];
  activities: string[];
  food: string[];
  hotels: string[];
}

export default function DestinationContent({ 
  destination, 
  session 
}: { 
  destination: string; 
  session: any 
}) {
  const [guide, setGuide] = useState<any>(null);
  const [images, setImages] = useState<CityImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagesLoading, setImagesLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Step 1: Generate/Fetch guide data
        const guideData = await generateDestinationGuide(destination);
        setGuide(guideData);
        setLoading(false);

        // Step 2: Fetch high-quality images from our new Unsplash API route
        setImagesLoading(true);
        const imgRes = await fetch(`/api/city-images?city=${encodeURIComponent(destination)}`);
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          setImages(imgData);
        }
      } catch (error) {
        console.error("Error loading destination data:", error);
      } finally {
        setLoading(false);
        setImagesLoading(false);
      }
    }

    loadData();
  }, [destination]);

  if (loading) {
    return <DestinationSkeleton />;
  }

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

  const isPremium = session?.user?.plan === 'pro';
  const fallbackImage = "/default-destination.jpg";

  // Map UnsplashImage arrays to strings for existing components
  const placesImages = images?.places || [];
  const activitiesImages = images?.activities || [];
  const hotelsImages = images?.hotels || [];

  return (
    <div className="w-full pb-12">
      {/* 1. Hero Section */}
      <DestinationHero 
        title={guide.hero?.title || `Explore ${destination}`} 
        description={guide.hero?.description || `Adventure unscripted. Uncover the magic of ${destination}.`} 
        destination={destination} 
        image={images?.hero || undefined}
      />

      <div className="w-full max-w-7xl mx-auto px-4">
        {/* 2. Quick Facts */}
        {guide.quickFacts && <QuickFacts facts={guide.quickFacts} />}

        {/* 3. Interactive Map (Premium) */}
        {isPremium && <InteractiveMap destination={destination} />}

        {/* 4. Popular Places */}
        {guide.popularPlaces && (
          <PopularPlaces 
            places={guide.popularPlaces} 
            destination={destination} 
            images={placesImages}
          />
        )}

        {/* 5. Trip Planner CTA */}
        <TripPlannerCTA destination={destination} />

        <div className="w-full">
          {!isPremium && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center my-8 shadow-sm">
              <h3 className="text-xl font-headline font-bold mb-2">Unlock the Full Experience</h3>
              <p className="text-muted-foreground mb-4">Upgrade to Pro to access interactive maps, weather forecasts, curated activities, and premium hotel marketplace recommendations for {destination}.</p>
              <a href="/pricing" className="inline-block bg-primary text-primary-foreground font-medium px-6 py-2 rounded-full hover:bg-primary/90 transition">
                Upgrade to Pro
              </a>
            </div>
          )}

          {isPremium && (
            <>
              {/* 6. Adventure Activities */}
              {guide.activities && (
                <AdventureActivities 
                  activities={guide.activities} 
                  images={activitiesImages}
                />
              )}

              {/* 7. Where To Stay & Marketplace */}
              <StayRecommendations 
                hotels={guide.hotels || []} 
                images={hotelsImages}
              />

              {/* 8. Rentals */}
              {guide.rentals && <RentalsSection rentals={guide.rentals} />}
            </>
          )}

          {/* 9. Nearby Destinations */}
          {guide.nearbyDestinations && (
            <NearbyDestinations 
              nearby={guide.nearbyDestinations} 
              images={[]} // Optional: could fetch more images if needed
            />
          )}
        </div>

        {/* 10 & 11. Travel Tips & Packing Guide inside a split row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 items-stretch">
          {guide.travelTips && <TravelTips tips={guide.travelTips} />}
          {guide.packingGuide && <PackingGuide items={guide.packingGuide} />}
        </div>
      </div>
    </div>
  );
}
