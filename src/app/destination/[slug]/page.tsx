import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDestinationGuide } from "@/ai/flows/generateDestinationGuide";
import {
  DestinationSkeleton, TripPlannerCTA, DestinationHero, QuickFacts,
  PopularPlaces, InteractiveMap, AdventureActivities, StayRecommendations,
  RentalsSection, NearbyDestinations, TravelTips, PackingGuide
} from "@/components/destination/DestinationComponents";
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
      <div className="flex-1 flex flex-col relative h-screen overflow-y-auto w-full">
        <Suspense fallback={<DestinationSkeleton />}>
          <DestinationContent destination={titleFormatted} session={session} />
        </Suspense>
        
        {/* Footer */}
        <footer className="mt-20 border-t py-12 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center opacity-70">
            <div className="flex items-center gap-2 font-bold font-headline mb-4 md:mb-0">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
               OnlyExplore
            </div>
            <div className="flex gap-6 text-sm">
               <span>©2026 OnlyExplore. All rights reserved.</span>
               <div className="flex gap-4">
                 <span>Instagram</span>
                 <span>Twitter</span>
                 <span>Facebook</span>
               </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

async function DestinationContent({ destination, session }: { destination: string; session: any }) {
  const guide = await generateDestinationGuide(destination);
  const isPremium = session?.user?.plan === 'pro';

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

  return (
    <div className="w-full pb-12">
      
      {/* 1. Hero Section */}
      <DestinationHero 
        title={guide.hero?.title || `Explore ${destination}`} 
        description={guide.hero?.description || `Adventure unscripted. Uncover the magic of ${destination}.`} 
        destination={destination} 
      />

      <div className="w-full max-w-7xl mx-auto px-4">
        
        {/* 2. Quick Facts */}
        {guide.quickFacts && <QuickFacts facts={guide.quickFacts} />}

        {/* 3. Interactive Map */}
        <InteractiveMap destination={destination} />

        {/* 4. Popular Places */}
        {guide.popularPlaces && <PopularPlaces places={guide.popularPlaces} destination={destination} />}

        {/* 5. Trip Planner CTA */}
        <TripPlannerCTA destination={destination} />

        {/* Premium Gating for the rest if needed, or linear rendering based on explicit prompt instructions */}
        <div className="w-full">
          {/* 6. Adventure Activities */}
          {guide.activities && <AdventureActivities activities={guide.activities} />}

          {/* 7. Where To Stay */}
          {guide.hotels && <StayRecommendations hotels={guide.hotels} />}

          {/* 8. Rentals */}
          {guide.rentals && <RentalsSection rentals={guide.rentals} />}

          {/* 9. Nearby Destinations */}
          {guide.nearbyDestinations && <NearbyDestinations nearby={guide.nearbyDestinations} />}

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
