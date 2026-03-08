import { MetadataRoute } from 'next';
import { connectDB } from '@/lib/mongodb';
import DestinationGuide from '@/models/DestinationGuide';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://onlyexplore.app';

  let destinationEntries: MetadataRoute.Sitemap = [];

  try {
    await connectDB();
    const destinations = await DestinationGuide.find({}, { destination: 1 }).lean();
    
    destinationEntries = destinations.map((guide: any) => ({
      url: `${baseUrl}/destination/${encodeURIComponent(guide.destination.toLowerCase())}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Failed to generate destination sitemaps:", error);
  }

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/chat`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/profile`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...destinationEntries,
  ];
}
