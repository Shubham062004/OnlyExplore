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
                <Button variant="link" onClick={() => setIsLogin(!isLogin)} className="w-full text-center">
                    {isLogin ? "Need an account? Register" : "Already have an account? Sign in"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
