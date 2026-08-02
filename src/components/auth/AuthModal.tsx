"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

interface AuthModalProps {
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultTab?: "login" | "signup" | "forgot";
  callbackUrl?: string;
  onSuccess?: () => void;
}

export function AuthModal({
  children,
  isOpen: controlledIsOpen,
  onOpenChange: controlledOnOpenChange,
  defaultTab = "login",
  callbackUrl = "/",
  onSuccess,
}: AuthModalProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [tab, setTab] = useState<"login" | "signup" | "forgot">(defaultTab);

  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTab(defaultTab);
    }
    if (isControlled) {
      controlledOnOpenChange?.(newOpen);
    } else {
      setInternalIsOpen(newOpen);
    }
  };

  const handleSuccess = () => {
    handleOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      {!children && !isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" className="font-bold border-border/60 hover:bg-muted transition-all">
            Sign In
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[440px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] p-8 overflow-hidden">
        {/* Background Accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <DialogHeader className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black font-headline tracking-tight uppercase">
              {tab === "forgot"
                ? "Reset Password"
                : tab === "login"
                ? "Sign In to OnlyExplore"
                : "Create Account"}
            </DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {tab === "forgot"
                ? "Enter your email to receive password reset instructions."
                : tab === "login"
                ? "Access saved trips, AI itineraries, and personalized travel guides."
                : "Join OnlyExplore to generate and manage personalized itineraries."}
            </p>
          </DialogHeader>

          {/* Tab Form Render */}
          {tab === "login" && (
            <LoginForm
              callbackUrl={callbackUrl}
              onSuccess={handleSuccess}
              onSwitchToSignup={() => setTab("signup")}
              onSwitchToForgotPassword={() => setTab("forgot")}
            />
          )}

          {tab === "signup" && (
            <SignupForm
              callbackUrl={callbackUrl}
              onSuccess={handleSuccess}
              onSwitchToLogin={() => setTab("login")}
            />
          )}

          {tab === "forgot" && (
            <ForgotPasswordForm
              onSwitchToLogin={() => setTab("login")}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
