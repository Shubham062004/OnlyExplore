import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://onlyexplore.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/destination/*'],
      disallow: ['/api/*', '/chat/*', '/profile'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
