"use client";

import { useEffect, Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthCard, buildActionUrl, PendingAction } from "@/components/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [storedTarget, setStoredTarget] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("onlyexplore_pending_action");
      if (raw) {
        const parsed = JSON.parse(raw) as PendingAction;
        if (parsed && Date.now() - parsed.timestamp < 5 * 60 * 1000) {
          setStoredTarget(buildActionUrl(parsed));
        }
      }
    } catch {}
  }, []);

  const searchCallbackUrl = searchParams.get("callbackUrl");
  // Respect callbackUrl > stored pending action > fallback "/"
  const callbackUrl = (searchCallbackUrl && searchCallbackUrl !== "/") 
    ? searchCallbackUrl 
    : (storedTarget || "/");

  const error = searchParams.get("error");
  const tabParam = searchParams.get("tab");
  const defaultTab = tabParam === "signup" ? "signup" : tabParam === "forgot" ? "forgot" : "login";

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(callbackUrl);
    }
  }, [status, session, callbackUrl, router]);

  useEffect(() => {
    if (error) {
      const errorMessages: Record<string, string> = {
        CredentialsSignin: "Invalid email/phone or password. Please try again.",
        OAuthSignin: "Could not sign in with Google. Please try again.",
        OAuthCallback: "Google sign-in was interrupted. Please try again.",
        OAuthCreateAccount: "Could not create account with Google.",
        EmailCreateAccount: "Could not create account with email.",
        Callback: "Authentication callback failed. Please try again.",
        OAuthAccountNotLinked: "Email is already linked to another login method.",
        EmailSignin: "The email sign-in link is invalid or expired.",
        SessionRequired: "Please sign in to access this page.",
        Default: "An error occurred during authentication. Please try again.",
      };

      const message = errorMessages[error] || errorMessages.Default;
      toast({
        variant: "destructive",
        title: "Authentication Alert",
        description: message,
      });
    }
  }, [error, toast]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 bg-gradient-to-br from-primary/10 via-background to-primary/5 relative overflow-hidden">
      {/* Background Accent Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main White Auth Card */}
      <div className="relative z-10 w-full flex justify-center">
        <AuthCard defaultTab={defaultTab} callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
