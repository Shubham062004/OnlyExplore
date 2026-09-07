'use client';

import React from 'react';
import { TestDetailPage } from '@/components/testCenter/TestDetailPage';

export default function CloudinaryTestPage() {
  return (
    <TestDetailPage
      title="Cloudinary CDN"
      category="Media & Images"
      description="Cloud media optimization pipeline delivering WebP transcoding, responsive sizing, and low-latency CDN distribution."
      apiEndpoint="/api/test/cloudinary"
      requiredEnvVars={[
        {
          name: 'CLOUDINARY_CLOUD_NAME',
          description: 'Cloudinary unique cloud name.',
          serverOnly: true,
        },
        {
          name: 'CLOUDINARY_API_KEY',
          description: 'Cloudinary REST API key.',
          serverOnly: true,
        },
        {
          name: 'CLOUDINARY_API_SECRET',
          description: 'Cloudinary API secret for authenticated uploads.',
          serverOnly: true,
        },
        {
          name: 'CLOUDINARY_URL',
          description: 'Optional single-string connection URI.',
          serverOnly: true,
        },
      ]}
      howItWorks="ImageService uploads external image URLs to Cloudinary CDN to prevent hotlinking, transcode to modern formats (AVIF/WebP), and cache assets across global edge servers."
      fixGuide={{
        portalName: 'Cloudinary Dashboard',
        portalUrl: 'https://cloudinary.com/console',
        steps: [
          'Create a free Cloudinary account.',
          'From your Management Console Dashboard, view "Product Environment Credentials".',
          'Copy your Cloud Name, API Key, and API Secret.',
          'Add them to .env and restart dev server.',
        ],
      }}
    />
  );
}
