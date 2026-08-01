"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, Lock, Hash, UserCircle, Eye, EyeOff, CheckSquare, Square, ShieldCheck, Sparkles } from "lucide-react";

export function AuthDialog({ children }: { children?: React.ReactNode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form fields
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");

  // UI state
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const { toast } = useToast();

  const resetStateIfClosed = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setOtpSent(false);
      setOtp("");
      setIsForgotPassword(false);
      setIsLogin(true);
      setPassword("");
      setShowPassword(false);
    }
  };

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone || !emailOrPhone.includes("@")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please enter your valid email address to receive password reset instructions.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailOrPhone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast({ title: "Reset Email Sent", description: data.message || "Instructions sent to your email." });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Reset Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (isForgotPassword) {
      await handleForgotPassword(e);
      return;
    }

    if (isLogin) {
      const res = await signIn("credentials", {
        emailOrPhone,
        password,
        otp: otpSent ? otp : "",
        redirect: false,
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
        setIsOpen(false);
      }
    } else {
      // Registration
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, emailOrPhone, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Registration Failed", description: data.error || "Server error" });
      } else {
        toast({
          title: "Account Created!",
          description: `A 6-digit verification code was sent to your ${emailOrPhone.includes("@") ? "email" : "phone"}.`,
        });
        setIsLogin(true);
        const method = emailOrPhone.includes("@") ? "email" : "phone";
        await handleSendOtp(method);
      }
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetStateIfClosed}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" className="font-bold border-border/60 hover:bg-muted transition-all">
            Sign In
          </Button>
        )}
      </DialogTrigger>

      {/* High-Contrast White/Slate Glassmorphism Card */}
      <DialogContent className="sm:max-w-[440px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] p-8 overflow-hidden">
        
        {/* Subtle Background Accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Header */}
          <DialogHeader className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-black font-headline tracking-tight uppercase">
              {isForgotPassword ? "Reset Password" : isLogin ? "Sign In to OnlyExplore" : "Create Account"}
            </DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isForgotPassword
                ? "Enter your email to receive password reset instructions."
                : isLogin
                ? "Access saved trips, AI itineraries, and personalized travel guides."
                : "Join OnlyExplore to generate and manage personalized itineraries."}
            </p>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name (Sign Up only) */}
            {!isLogin && !isForgotPassword && (
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
                    className="bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 pl-10 rounded-2xl h-11 text-xs font-medium focus-visible:ring-primary"
                  />
                  <UserCircle className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            )}

            {/* Email or Phone Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {isForgotPassword ? "Account Email" : "Email or Phone Number"}
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={isForgotPassword ? "you@example.com" : "you@example.com or +91..."}
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  required
                  disabled={isLoading || otpSent}
                  className="bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 pl-10 rounded-2xl h-11 text-xs font-medium focus-visible:ring-primary"
                />
                <div className="absolute left-3.5 top-3.5 text-slate-400">
                  {emailOrPhone.includes("@") ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                </div>
              </div>
            </div>

            {/* Password Input with Eye/EyeOff Toggle */}
            {!isForgotPassword && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  {isLogin && !otpSent && (
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
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
                    className="bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 pl-10 pr-10 rounded-2xl h-11 text-xs font-medium focus-visible:ring-primary"
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
            )}

            {/* Remember Me Checkbox */}
            {isLogin && !isForgotPassword && !otpSent && (
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

            {/* OTP Section (Only visible when 2FA / verification requested) */}
            {otpSent && !isForgotPassword && (
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
                    className="bg-slate-50 dark:bg-slate-800/80 border-primary text-center font-mono tracking-[0.4em] text-lg font-bold h-12 rounded-2xl"
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
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isForgotPassword
                ? "Send Password Reset Link"
                : isLogin
                ? otpSent
                  ? "Verify Code & Sign In"
                  : "Sign In"
                : "Create Free Account"}
            </Button>
          </form>

          {/* Social Google Login Divider & Button */}
          {!isForgotPassword && !otpSent && (
            <div className="space-y-4 pt-2">
              <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-400">
                <span className="bg-white dark:bg-slate-900 px-3 z-10">Or continue with</span>
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
              </div>

              <Button
                variant="outline"
                type="button"
                className="w-full h-11 rounded-2xl border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                <svg className="w-4 h-4" viewBox="0 0 488 512">
                  <path
                    fill="currentColor"
                    d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                  />
                </svg>
                Sign In with Google
              </Button>
              <p className="text-[9px] text-center text-slate-400 font-medium">
                One-click OAuth authentication powered by Google Security.
              </p>
            </div>
          )}

          {/* Toggle Tab Footer */}
          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            {isForgotPassword ? (
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                ← Back to Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setOtpSent(false);
                }}
                className="text-xs font-bold text-primary hover:underline transition-all"
              >
                {isLogin ? "Don't have an account? Sign Up for Free" : "Already registered? Sign In here"}
              </button>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}
