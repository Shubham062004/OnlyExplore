"use client";

import { Suspense } from "react";
import { AuthCard } from "@/components/auth";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 bg-gradient-to-br from-primary/10 via-background to-primary/5 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 w-full flex justify-center">
        <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin text-primary" />}>
          <AuthCard defaultTab="forgot" />
        </Suspense>
      </div>
    </div>
  );
}
