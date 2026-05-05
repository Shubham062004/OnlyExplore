"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Phone, Lock, Hash, UserCircle } from "lucide-react";

export function AuthDialog({ children }: { children?: React.ReactNode }) {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);

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
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send OTP");

            setOtpSent(true);
            toast({ title: "Verification Required", description: `Please check your ${method} for the 6-digit code.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailOrPhone || !emailOrPhone.includes("@")) {
            toast({ variant: "destructive", title: "Error", description: "Please enter your email address to reset password." });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailOrPhone })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast({ title: "Reset Link Sent", description: data.message });
            setIsForgotPassword(false);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
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
            // Check if OTP needs to be sent explicitly by user pressing Login with OTP (Not implemented yet, handled auto by 2FA)
            const res = await signIn("credentials", {
                emailOrPhone,
                password,
                otp: otpSent ? otp : "",
                redirect: false
            });

            if (res?.error) {
                if (res.error.startsWith("2FA_REQUIRED") || res.error === "UNVERIFIED_EMAIL" || res.error === "UNVERIFIED_PHONE") {
                    // Logic to send OTP based on methods available
                    // Assume we just send to the login method if it's email or phone
                    const method = emailOrPhone.includes("@") ? "email" : "phone";
                    await handleSendOtp(method);
                } else {
                    toast({ variant: "destructive", title: "Login Failed", description: res.error });
                }
            } else {
                toast({ title: "Success", description: "Logged in successfully!" });
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
                toast({ title: "Account Created", description: `Sending a 6-digit verification code to your ${emailOrPhone.includes("@") ? "email" : "phone"}.` });
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
                {children || <Button variant="outline" className="font-semibold backdrop-blur-md bg-white/10 hover:bg-white/20 transition-all">Sign In</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass border-white/20 shadow-2xl overflow-hidden p-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none" />

                <div className="relative p-6 pt-8 text-foreground">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold text-center tracking-tight">
                            {isForgotPassword ? "Reset Password" : (isLogin ? "Welcome Back" : "Create Account")}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && !isForgotPassword && (
                            <div className="relative">
                                <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading || otpSent} className="bg-background/50 pl-10" />
                                <div className="absolute left-3 top-2.5 text-muted-foreground"><UserCircle className="w-4 h-4" /></div>
                            </div>
                        )}

                        <div className="relative">
                            <Input
                                type="text"
                                placeholder={isForgotPassword ? "Email Address" : "Email or Phone Number"}
                                value={emailOrPhone}
                                onChange={(e) => setEmailOrPhone(e.target.value)}
                                required
                                disabled={isLoading || otpSent}
                                className="bg-background/50 pl-10"
                            />
                            <div className="absolute left-3 top-2.5 text-muted-foreground">
                                {emailOrPhone.includes("@") ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                            </div>
                        </div>

                        {!isForgotPassword && (
                            <div className="relative">
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading || otpSent}
                                    className="bg-background/50 pl-10"
                                />
                                <div className="absolute left-3 top-2.5 text-muted-foreground"><Lock className="w-4 h-4" /></div>
                            </div>
                        )}

                        {(isLogin && !isForgotPassword && !otpSent) && (
                            <div className="flex justify-between items-center">
                                <Button variant="link" type="button" onClick={() => setIsForgotPassword(true)} className="px-0 py-0 h-auto text-xs text-primary font-medium">
                                    Forgot password?
                                </Button>
                            </div>
                        )}

                        {otpSent && !isForgotPassword && (
                            <div className="relative animate-in slide-in-from-bottom-2 fade-in duration-300">
                                <Input
                                    type="text"
                                    placeholder="6-digit OTP from 2FA"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    maxLength={6}
                                    className="bg-background/50 pl-10 font-mono tracking-widest text-center"
                                />
                                <div className="absolute left-3 top-2.5 text-muted-foreground"><Hash className="w-4 h-4" /></div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-xs text-muted-foreground">Expires in 5:00</span>
                                    <Button variant="link" type="button" onClick={() => handleSendOtp(emailOrPhone.includes("@") ? "email" : "phone")} className="px-0 py-0 h-auto text-xs" disabled={isLoading}>
                                        Resend Code
                                    </Button>
                                </div>
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all font-semibold" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isForgotPassword
                                ? "Send Reset Link"
                                : (isLogin
                                    ? (otpSent ? "Verify Code & Login" : "Sign In")
                                    : "Create Account")}
                        </Button>
                    </form>

                    {!isForgotPassword && !otpSent && (
                        <>
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border/50" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background/80 backdrop-blur-sm px-2 text-muted-foreground font-medium">Or</span>
                                </div>
                            </div>

                            <Button variant="outline" type="button" className="w-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-all border-border/50" onClick={() => signIn("google", { callbackUrl: "/" })}>
                                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                                Continue with Google
                            </Button>
                        </>
                    )}

                    <div className="mt-6 text-center">
                        {isForgotPassword ? (
                            <Button variant="link" onClick={() => setIsForgotPassword(false)} className="text-muted-foreground hover:text-foreground">
                                Back to Sign In
                            </Button>
                        ) : (
                            <Button variant="link" onClick={() => { setIsLogin(!isLogin); setOtpSent(false); }} className="text-sm font-medium">
                                {isLogin ? "Need an account? Register" : "Already have an account? Sign in"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
