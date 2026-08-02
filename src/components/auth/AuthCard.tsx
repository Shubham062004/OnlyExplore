"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

interface AuthCardProps {
  defaultTab?: "login" | "signup" | "forgot";
  callbackUrl?: string;
  onSuccess?: () => void;
  className?: string;
}

export function AuthCard({
  defaultTab = "login",
  callbackUrl = "/",
  onSuccess,
  className = "",
}: AuthCardProps) {
  const [tab, setTab] = useState<"login" | "signup" | "forgot">(defaultTab);

  return (
    <div
      className={`w-full max-w-[440px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] p-8 relative overflow-hidden transition-all ${className}`}
    >
      {/* Background Accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black font-headline tracking-tight uppercase">
            {tab === "forgot"
              ? "Reset Password"
              : tab === "login"
              ? "Sign In to OnlyExplore"
              : "Create Account"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {tab === "forgot"
              ? "Enter your email to receive password reset instructions."
              : tab === "login"
              ? "Access saved trips, AI itineraries, and personalized travel guides."
              : "Join OnlyExplore to generate and manage personalized itineraries."}
          </p>
        </div>

        {/* Tab Form Render */}
        {tab === "login" && (
          <LoginForm
            callbackUrl={callbackUrl}
            onSuccess={onSuccess}
            onSwitchToSignup={() => setTab("signup")}
            onSwitchToForgotPassword={() => setTab("forgot")}
          />
        )}

        {tab === "signup" && (
          <SignupForm
            callbackUrl={callbackUrl}
            onSuccess={onSuccess}
            onSwitchToLogin={() => setTab("login")}
          />
        )}

        {tab === "forgot" && (
          <ForgotPasswordForm
            onSwitchToLogin={() => setTab("login")}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </div>
  );
}
