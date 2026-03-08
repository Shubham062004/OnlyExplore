"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast({ variant: "destructive", title: "Error", description: "Missing or invalid reset token. Please check your link." });
            return;
        }

        if (password !== confirmPassword) {
            toast({ variant: "destructive", title: "Mismatch", description: "Passwords do not match." });
            return;
        }

        if (password.length < 6) {
            toast({ variant: "destructive", title: "Weak Password", description: "Password must be at least 6 characters." });
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to reset password.");

            toast({ title: "Success", description: "Your password has been successfully reset. You can now login with your new password." });

            setTimeout(() => {
                window.location.href = "/";
            }, 2000);

        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            <div className="relative">
                <Input
                    type="password"
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="bg-background/50 pl-10 h-12 border-border/50 transition-all font-medium"
                />
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
            </div>

            <div className="relative">
                <Input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    className="bg-background/50 pl-10 h-12 border-border/50 transition-all font-medium"
                />
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
            </div>

            <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 font-bold text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg mt-2"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Reset Password"}
            </Button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex h-screen items-center justify-center bg-background bg-gradient-to-br from-primary/5 to-primary/10 px-4">
            <div className="w-full max-w-lg glass border border-white/20 shadow-2xl rounded-2xl p-8 relative overflow-hidden text-foreground">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background pointer-events-none" />
                <h1 className="text-3xl font-bold font-headline mb-2 text-center relative z-10">Reset Password</h1>
                <p className="text-muted-foreground mb-6 text-center text-sm relative z-10">
                    Enter your new password below.
                </p>

                <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
                    <ResetPasswordForm />
                </Suspense>

                <div className="mt-6 text-center relative z-10">
                    <a href="/" className="text-sm font-medium hover:text-primary transition-all text-muted-foreground">
                        Cancel and back to Home
                    </a>
                </div>
            </div>
        </div>
    );
}
