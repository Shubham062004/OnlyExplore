import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { MessageSquare, Plus, LogOut, Menu, X, Sparkles } from "lucide-react";
import { AuthDialog } from "./AuthDialog";
import { Button } from "./ui/button";
import { ProfileModal } from "./ProfileModal";

interface Chat {
    _id: string;
    title: string;
}

export function Sidebar({ onSelectChat, onNewChat, refreshKey }: { onSelectChat: (id: string) => void, onNewChat: () => void, refreshKey?: number }) {
    const { data: session } = useSession();
    const [chats, setChats] = useState<Chat[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const isPro = (session?.user as any)?.plan === "pro";

    useEffect(() => {
        if (session?.user) {
            fetch("/api/chats")
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) setChats(data);
                })
                .catch(console.error);
        }
    }, [session, refreshKey]);

    return (
        <>
            {/* Toggle Button in Layout */}
            <Button
                variant="outline"
                size="icon"
                className={`fixed top-4 z-50 transition-all duration-300 ease-in-out backdrop-blur-lg bg-white/10 dark:bg-black/30 shadow-md border-white/20 hover:bg-white/20 dark:hover:bg-black/50 ${isOpen ? 'left-[16.5rem]' : 'left-4'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X /> : <Menu />}
            </Button>

            <div className={`
        fixed inset-y-0 left-0 z-40
        w-64 h-screen backdrop-blur-xl bg-white/80 dark:bg-zinc-950/80 border-r border-white/20 dark:border-white/10 flex flex-col overflow-hidden transition-transform duration-300 ease-in-out shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="p-4 pt-16 border-b border-border/50 shrink-0">
                    <Button onClick={() => { onNewChat(); setIsOpen(false); }} className="w-full flex items-center gap-2 transition-all shadow-sm">
                        <Plus className="w-4 h-4" /> New Trip
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {session ? (
                        chats.length > 0 ? (
                            chats.map((chat) => (
                                <button
                                    key={chat._id}
                                    onClick={() => { onSelectChat(chat._id); setIsOpen(false); }}
                                    className="w-full text-left p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors group"
                                >
                                    <MessageSquare className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                                    <span className="truncate text-sm font-medium">{chat.title}</span>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center mt-4">No past trips yet.</p>
                        )
                    ) : (
                        <div className="text-center space-y-4 mt-8">
                            <p className="text-sm text-muted-foreground">Log in to save your awesome trips!</p>
                            <AuthDialog />
                        </div>
                    )}
                </div>

                {session && (
                    <div className="p-4 border-t border-border/50 shrink-0 space-y-4 backdrop-blur-md">
                        {isPro ? (
                            <ProfileModal>
                                <button className="w-full text-left p-3 rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/5 relative overflow-hidden group hover:ring-2 ring-amber-500/50 transition-all cursor-pointer">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_10px_rgba(251,191,36,0.5)]">
                                            <Sparkles className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Premium Status</span>
                                    </div>
                                </button>
                            </ProfileModal>
                        ) : (
                            <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 flex flex-col gap-2">
                                <p className="text-xs text-muted-foreground font-medium text-center">Unlock full potential</p>
                                <Button
                                    className="w-full h-8 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-purple-500/25 transition-all"
                                    onClick={() => {
                                        fetch("/api/stripe/checkout", { method: "POST" })
                                            .then((res) => res.json())
                                            .then((data) => {
                                                if (data.url) window.location.href = data.url;
                                            });
                                    }}
                                >
                                    Upgrade to Pro
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <ProfileModal>
                                <button className="flex items-center gap-2 text-sm font-medium truncate hover:underline cursor-pointer text-left focus:outline-none max-w-[80%]">
                                    {session.user?.image ? (
                                        <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full border border-border shrink-0 object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                            <span className="text-primary text-xs font-bold">{(session.user?.name || session.user?.email || "?").charAt(0).toUpperCase()}</span>
                                        </div>
                                    )}
                                    <span className="truncate">{session.user?.name || session.user?.email}</span>
                                </button>
                            </ProfileModal>
                            <Button variant="ghost" size="icon" onClick={() => signOut()} className="shrink-0 hover:bg-red-500/10 hover:text-red-500 transition-colors">
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
