"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail, Loader2 } from "lucide-react";
import { Captcha } from "@/components/Captcha";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            toast({ variant: "destructive", title: "Wait", description: "Please enter a valid email." });
            return;
        }

        if (!captchaToken) {
            toast({ variant: "destructive", title: "Captcha required", description: "Please complete the CAPTCHA." });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, captchaToken }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to send reset link.");

            toast({ title: "Email Sent", description: data.message || "If that account exists, we sent a password reset link." });
            setEmail("");
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex h-screen items-center justify-center bg-background bg-gradient-to-br from-primary/5 to-primary/10 px-4">
            <div className="w-full max-w-lg glass border border-white/20 shadow-2xl rounded-2xl p-8 relative overflow-hidden text-foreground">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none" />
                <h1 className="text-3xl font-bold font-headline mb-2 text-center relative z-10">Forgot Password</h1>
                <p className="text-muted-foreground mb-6 text-center text-sm relative z-10">
                    We will send a reset link to your email.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                    <div className="relative">
                        <Input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                            className="bg-background/50 pl-10 h-12 border-border/50 transition-all font-medium"
                        />
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
                    </div>

                    <Captcha onVerify={setCaptchaToken} />

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 font-bold text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Send Reset Link"}
                    </Button>
                </form>

                <div className="mt-6 text-center relative z-10">
                    <a href="/" className="text-sm font-medium hover:text-primary transition-all text-muted-foreground">
                        Back to Login
                    </a>
                </div>
            </div>
        </div>
    );
}
