"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { AuthIntentProvider } from "@/components/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <AuthIntentProvider>
          {children}
        </AuthIntentProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
