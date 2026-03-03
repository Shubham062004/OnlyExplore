import { useState } from "react";
import { signIn } from "next-auth/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export function AuthDialog({ children }: { children?: React.ReactNode }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            const res = await signIn("credentials", { email, password, redirect: false });
            if (res?.error) {
                toast({ variant: "destructive", title: "Login Failed", description: "Invalid email or password." });
            } else {
                toast({ title: "Success", description: "Logged in successfully!" });
                setIsOpen(false);
            }
        } else {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });
            if (!res.ok) {
                toast({ variant: "destructive", title: "Registration Failed", description: await res.text() });
            } else {
                toast({ title: "Success", description: "Registration successful! Please log in." });
                setIsLogin(true);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="outline">Sign In</Button>}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isLogin ? "Sign In" : "Register"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {!isLogin && (
                        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
                    )}
                    <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button type="submit" className="w-full">{isLogin ? "Sign In" : "Register"}</Button>
                </form>
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-muted-foreground/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                </div>
                <Button variant="outline" type="button" className="w-full" onClick={() => signIn("google", { callbackUrl: "/" })}>
                    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                    Continue with Google
                </Button>
                <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="w-full text-center">
                    {isLogin ? "Need an account? Register" : "Already have an account? Sign in"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
