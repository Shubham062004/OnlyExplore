"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, Lock, Eye, EyeOff, UserCircle, Hash } from "lucide-react";
import { GoogleButton } from "./GoogleButton";

interface SignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  callbackUrl?: string;
}

export function SignupForm({
  onSuccess,
  onSwitchToLogin,
  callbackUrl = "/",
}: SignupFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const handleSendOtp = async (method: "email" | "phone") => {
    setIsLoading(true);
    try {
      const endpoint = method === "email" ? "/api/auth/send-email-otp" : "/api/auth/send-phone-otp";
      const payload = method === "email" ? { email: emailOrPhone } : { phone: emailOrPhone };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send verification code");

      setOtpSent(true);
      toast({
        title: "Verification Code Sent",
        description: `Check your ${method} for the 6-digit verification code.`,
      });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Verification Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (otpSent) {
      // Verify OTP and complete sign in
      const res = await signIn("credentials", {
        emailOrPhone,
        password,
        otp,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        toast({ variant: "destructive", title: "Verification Failed", description: res.error });
      } else {
        toast({ title: "Account Verified!", description: "Welcome to OnlyExplore." });
        await getSession();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(callbackUrl);
        }
      }
      setIsLoading(false);
      return;
    }

    // Step 1: Register account
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emailOrPhone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ variant: "destructive", title: "Registration Failed", description: data.error || "Server error" });
        setIsLoading(false);
      } else {
        toast({
          title: "Account Created!",
          description: `A 6-digit verification code was sent to your ${emailOrPhone.includes("@") ? "email" : "phone"}.`,
        });
        const method = emailOrPhone.includes("@") ? "email" : "phone";
        await handleSendOtp(method);
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Error", description: error.message || "Failed to create account." });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Full Name
          </label>
          <div className="relative">
            <Input
              placeholder="Subham Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading || otpSent}
              className="bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 pl-10 rounded-2xl h-11 text-xs font-medium focus-visible:ring-primary text-slate-900 dark:text-white"
            />
            <UserCircle className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Email or Phone Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Email or Phone Number
          </label>
          <div className="relative">
            <Input
              type="text"
              placeholder="you@example.com or +91..."
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              disabled={isLoading || otpSent}
              className="bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 pl-10 rounded-2xl h-11 text-xs font-medium focus-visible:ring-primary text-slate-900 dark:text-white"
            />
            <div className="absolute left-3.5 top-3.5 text-slate-400">
              {emailOrPhone.includes("@") ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || otpSent}
              className="bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 pl-10 pr-10 rounded-2xl h-11 text-xs font-medium focus-visible:ring-primary text-slate-900 dark:text-white"
            />
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* OTP Section (Verification) */}
        {otpSent && (
          <div className="space-y-2 pt-2 animate-in slide-in-from-bottom-2 duration-300">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary block text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="relative">
              <Input
                type="text"
                placeholder="1 2 3 4 5 6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                disabled={isLoading}
                maxLength={6}
                className="bg-slate-50 dark:bg-slate-800/80 border-primary text-center font-mono tracking-[0.4em] text-lg font-bold h-12 rounded-2xl text-slate-900 dark:text-white"
              />
              <Hash className="w-4 h-4 text-primary absolute left-3.5 top-4" />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold px-1">
              <span>Code expires in 5:00</span>
              <button
                type="button"
                onClick={() => handleSendOtp(emailOrPhone.includes("@") ? "email" : "phone")}
                className="text-primary hover:underline"
                disabled={isLoading}
              >
                Resend Code
              </button>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white transition-all"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : otpSent ? "Verify & Complete Signup" : "Create Free Account"}
        </Button>
      </form>

      {/* Social Google Login Divider & Button */}
      {!otpSent && (
        <div className="space-y-4 pt-2">
          <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-400">
            <span className="bg-white dark:bg-slate-900 px-3 z-10">Or continue with</span>
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
          </div>

          <GoogleButton callbackUrl={callbackUrl} />
          <p className="text-[9px] text-center text-slate-400 font-medium">
            One-click OAuth authentication powered by Google Security.
          </p>
        </div>
      )}

      {/* Switch to Sign In */}
      {onSwitchToLogin && (
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-xs font-bold text-primary hover:underline transition-all"
          >
            Already registered? Sign In here
          </button>
        </div>
      )}
    </div>
  );
}
