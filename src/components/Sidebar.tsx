import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { MessageSquare, Plus, LogOut, Menu, X } from "lucide-react";
import { AuthDialog } from "./AuthDialog";
import { Button } from "./ui/button";

interface Chat {
    _id: string;
    title: string;
}

export function Sidebar({ onSelectChat, onNewChat }: { onSelectChat: (id: string) => void, onNewChat: () => void }) {
    const { data: session } = useSession();
    const [chats, setChats] = useState<Chat[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (session?.user) {
            fetch("/api/chats")
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) setChats(data);
                })
                .catch(console.error);
        }
    }, [session]);

    return (
        <>
            {/* Mobile Toggle */}
            <Button
                variant="outline"
                size="icon"
                className="md:hidden fixed top-4 left-4 z-50 bg-background"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X /> : <Menu />}
            </Button>

            <div className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 h-screen bg-card border-r flex flex-col overflow-hidden transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
                <div className="p-4 border-b shrink-0">
                    <Button onClick={() => { onNewChat(); setIsOpen(false); }} className="w-full flex items-center gap-2">
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
                                    className="w-full text-left p-3 rounded-lg hover:bg-muted/50 flex items-center gap-3 transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <span className="truncate text-sm font-medium">{chat.title}</span>
                                </button>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">No past trips yet.</p>
                        )
                    ) : (
                        <div className="text-center space-y-4 mt-8">
                            <p className="text-sm text-muted-foreground">Log in to save your awesome trips!</p>
                            <AuthDialog />
                        </div>
                    )}
                </div>

                {session && (
                    <div className="p-4 border-t border-border shrink-0">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate pr-2">{session.user?.name || session.user?.email}</span>
                            <Button variant="ghost" size="icon" onClick={() => signOut()} className="shrink-0">
                                <LogOut className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
