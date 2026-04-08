import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DestinationContent from "./DestinationContent";
import { DestinationSidebar } from "./DestinationSidebar";
import { DestinationSkeleton } from "@/components/destination/DestinationComponents";
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
        <DestinationContent destination={titleFormatted} session={session} />
        
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
