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
import type { Metadata, ResolvingMetadata } from 'next';

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const titleFormatted = decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1).toLowerCase();

  return {
    title: `Explore ${titleFormatted} Travel Guide | OnlyExplore`,
    description: `Discover the best activities, hotels, and itineraries for ${titleFormatted}. Start planning your perfect trip today with OnlyExplore.`,
    openGraph: {
      title: `Explore ${titleFormatted} Travel Guide`,
      description: `Discover the best activities, hotels, and itineraries for ${titleFormatted}.`,
      type: "website",
      images: [
        {
          url: `https://onlyexplore.app/api/og?title=${encodeURIComponent(titleFormatted)}`,
          width: 1200,
          height: 630,
          alt: `${titleFormatted} Travel Guide`,
        },
      ],
    },
  };
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const session = await getServerSession(authOptions);
  
  // Clean up title format
  const titleFormatted = decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1).toLowerCase();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: titleFormatted,
    description: `Ultimate travel guide and itinerary planner for ${titleFormatted}.`,
    url: `https://onlyexplore.app/destination/${encodeURIComponent(titleFormatted.toLowerCase())}`
  };

  return (
    <div className="flex w-full min-h-screen bg-background text-foreground overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

        {/* 3. Interactive Map (Premium) */}
        {isPremium && <InteractiveMap destination={destination} />}

        {/* 4. Popular Places */}
        {guide.popularPlaces && <PopularPlaces places={guide.popularPlaces} destination={destination} />}

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
              {guide.activities && <AdventureActivities activities={guide.activities} />}

              {/* 7. Where To Stay & Marketplace */}
              {guide.hotels ? (
                <StayRecommendations hotels={guide.hotels} />
              ) : (
                <div className="mb-12">
                   <h3 className="text-2xl font-headline font-bold mb-6">Hotels & Marketplace Deals</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     {[1,2,3].map((i) => (
                       <div key={i} className="bg-card border rounded-2xl p-4 shadow-sm flex flex-col gap-2">
                         <div className="w-full h-32 bg-muted rounded-xl bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80')` }} />
                         <h4 className="font-bold">Luxury Resort {i}</h4>
                         <p className="text-sm text-muted-foreground">Downtown {destination}</p>
                         <div className="flex justify-between items-center mt-2">
                           <span className="font-bold text-lg">₹{4000 * i} <span className="text-xs font-normal">/ night</span></span>
                           <span className="text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">★ {4.5 + i * 0.1}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {/* 8. Rentals */}
              {guide.rentals && <RentalsSection rentals={guide.rentals} />}

              {/* 9. Travel Tips & Weather */}
              {guide.travelTips && <TravelTips tips={guide.travelTips} />}

              {/* 10. Packing Guide */}
              {guide.packingGuide && <PackingGuide items={guide.packingGuide} />}
            </>
          )}

          {/* 11. Nearby Destinations */}
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
