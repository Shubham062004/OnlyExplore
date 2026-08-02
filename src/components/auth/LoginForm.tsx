"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, Lock, Eye, EyeOff, CheckSquare, Square, Hash } from "lucide-react";
import { GoogleButton } from "./GoogleButton";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignup?: () => void;
  onSwitchToForgotPassword?: () => void;
  callbackUrl?: string;
}

export function LoginForm({
  onSuccess,
  onSwitchToSignup,
  onSwitchToForgotPassword,
  callbackUrl = "/",
}: LoginFormProps) {
  const router = useRouter();
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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

    try {
      const res = await signIn("credentials", {
        emailOrPhone,
        password,
        otp: otpSent ? otp : "",
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        if (res.error.startsWith("2FA_REQUIRED") || res.error === "UNVERIFIED_EMAIL" || res.error === "UNVERIFIED_PHONE") {
          const method = emailOrPhone.includes("@") ? "email" : "phone";
          await handleSendOtp(method);
        } else {
          toast({ variant: "destructive", title: "Sign In Failed", description: res.error });
        }
      } else {
        toast({ title: "Welcome Back!", description: "Logged in successfully to OnlyExplore." });
        // Force NextAuth session refresh synchronously
        await getSession();
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(callbackUrl);
        }
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sign In Error", description: error.message || "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Password
            </label>
            {onSwitchToForgotPassword && !otpSent && (
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-[10px] font-bold text-primary hover:underline focus:outline-none"
              >
                Forgot password?
              </button>
            )}
          </div>
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

        {/* Remember Me Checkbox */}
        {!otpSent && (
          <div
            onClick={() => setRememberMe(!rememberMe)}
            className="flex items-center gap-2 cursor-pointer pt-1"
          >
            {rememberMe ? (
              <CheckSquare className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <Square className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium select-none">
              Remember me on this browser
            </span>
          </div>
        )}

        {/* OTP Section (Verification / 2FA) */}
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
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : otpSent ? "Verify Code & Sign In" : "Sign In"}
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

      {/* Switch to Sign Up */}
      {onSwitchToSignup && (
        <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-xs font-bold text-primary hover:underline transition-all"
          >
            Don't have an account? Sign Up for Free
          </button>
        </div>
      )}
    </div>
  );
}
