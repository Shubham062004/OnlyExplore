"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { TripCard } from "./TripCard";
import { History, Loader2 } from "lucide-react";

interface Chat {
  _id: string;
  title: string;
}

export function PastTrips() {
  const { data: session } = useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/chats")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setChats(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [session]);

  if (loading) {
    return (
      <div className="w-full mt-12 px-4 pb-12 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session || chats.length === 0) return null;

  return (
    <div className="w-full mt-12 px-4 pb-12">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-accent" />
        <h2 className="text-2xl font-bold font-headline">Past trips</h2>
      </div>

      <div className="flex overflow-x-auto gap-4 sm:gap-6 pb-6 px-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chats.map((chat) => (
          <div key={chat._id} className="snap-start shrink-0">
            <TripCard _id={chat._id} title={chat.title} />
          </div>
        ))}
      </div>
    </div>
  );
}
