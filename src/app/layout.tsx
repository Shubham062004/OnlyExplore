import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

import { Providers } from '@/components/Providers';
import { seedUsers } from '@/lib/seedUsers';

export const metadata: Metadata = {
  title: 'Only Explore',
  description: 'Create personalized travel itineraries with our chat-based AI.',
};

// Seed dev users once at startup (no-op in production)
if (!(global as any).__devUsersSeedDone) {
  (global as any).__devUsersSeedDone = true;
  seedUsers();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body
      // className="font-body antialiased"
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
