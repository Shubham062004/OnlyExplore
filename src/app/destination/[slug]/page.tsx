import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDestinationGuide } from "@/ai/flows/generateDestinationGuide";
import {
  SkeletonLoader, TripPlannerCTA, DestinationHero, QuickFacts,
  PopularPlaces, AdventureActivities, StayRecommendations,
  RentalsSection, NearbyDestinations, TravelTips, PackingGuide
} from "@/components/destination/DestinationComponents";
import { TravelMap } from "@/components/TravelMap";
import { getDistance, getTravelTime } from "@/lib/maps";
import { DestinationSidebar } from "./DestinationSidebar";

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const session = await getServerSession(authOptions);
  
  // Clean up title format
  const titleFormatted = decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1).toLowerCase();

  return (
    <div className="flex w-full min-h-screen bg-background text-foreground overflow-hidden">
      <DestinationSidebar />
      <div className="flex-1 flex flex-col relative h-screen overflow-y-auto">
        <Suspense fallback={<SkeletonLoader />}>
          <DestinationContent destination={titleFormatted} session={session} />
        </Suspense>
      </div>
    </div>
  );
}

async function DestinationContent({ destination, session }: { destination: string; session: any }) {
  const guide = await generateDestinationGuide(destination);
  const isPremium = session?.user?.plan === 'pro';

  if (!guide) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold font-headline mb-4">Content Not Available</h2>
        <p className="text-muted-foreground bg-muted p-4 rounded-xl text-center">
          Unable to generate a travel guide for <b>{destination}</b> at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full pb-12">
      
      {/* 1. Hero */}
      <DestinationHero 
        title={guide.hero?.title || `Explore ${destination}`} 
        description={guide.hero?.description || `Discover the secrets of ${destination}.`} 
        destination={destination} 
      />

      {/* 2. Top CTA */}
      <TripPlannerCTA destination={destination} />

      {/* 3. Quick Facts */}
      {guide.quickFacts && <QuickFacts facts={guide.quickFacts} />}

      <div className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Core Timeline */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Places */}
          {guide.popularPlaces && (
            <PopularPlaces places={guide.popularPlaces} destination={destination} />
          )}

          {/* Premium Map */}
          {isPremium && (
             <div className="mt-8">
               <h3 className="text-2xl font-bold font-headline mb-4 text-foreground">Interactive Zone</h3>
               <TravelMap destination={destination} />
             </div>
          )}

          {/* Premium Adventure */}
          {isPremium && guide.activities && (
             <AdventureActivities activities={guide.activities} />
          )}

          {/* Premium Staying & Rentals */}
          {isPremium && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              <StayRecommendations hotels={guide.hotels} />
              <RentalsSection rentals={guide.rentals} />
            </div>
          )}

        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          
          {/* Premium Info */}
          {isPremium && (
            <>
              {guide.nearbyDestinations && <NearbyDestinations nearby={guide.nearbyDestinations} />}
              {guide.travelTips && <TravelTips tips={guide.travelTips} />}
              {guide.packingGuide && <PackingGuide items={guide.packingGuide} />}
            </>
          )}

          {/* Free Info Promo */}
          {!isPremium && (
             <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 shadow-sm text-center">
               <h3 className="text-xl font-bold mb-3 text-primary">Unlock Pro Insights</h3>
               <p className="text-sm text-muted-foreground mb-4">
                 Upgrade to see Interactive Maps, Hand-picked Hotels, Rentals, and precise Travel Tips perfectly tuned for {destination}.
               </p>
             </div>
          )}

        </div>
      </div>

      {/* bottom CTA */}
      <TripPlannerCTA destination={destination} />
      
    </div>
  );
}
