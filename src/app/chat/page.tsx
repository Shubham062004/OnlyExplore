"use client";

import { Suspense } from "react";
import OnlyExplore from "@/components/OnlyExplore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Loader2 } from "lucide-react";

export default function ChatPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
      <ErrorBoundary
        fallback={
          <div className="flex flex-col items-center justify-center h-screen space-y-4 p-8 text-center">
            <h2 className="text-xl font-bold">Chat Unavailable</h2>
            <p className="text-sm text-muted-foreground">
              We encountered an issue loading the travel planner. You can try refreshing the page.
            </p>
          </div>
        }
      >
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center bg-background">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          }
        >
          <OnlyExplore />
        </Suspense>
      </ErrorBoundary>
    </main>
  );
}
