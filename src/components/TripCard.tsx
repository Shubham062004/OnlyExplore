"use client";

import { useRouter } from "next/navigation";
import { Plane } from "lucide-react";

interface TripCardProps {
  _id: string;
  title: string;
}

export function TripCard({ _id, title }: TripCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/chat/${_id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm border border-border/50 bg-card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-[200px] sm:w-[240px] md:w-[280px] shrink-0 flex flex-col items-center justify-center p-6 gap-4"
    >
      {/* Fallback OnlyExplore logo style */}
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
        <Plane className="w-8 h-8 text-primary" />
      </div>

      <h3 className="text-foreground font-headline text-lg sm:text-xl font-semibold leading-tight text-center line-clamp-2">
        {title}
      </h3>
    </div>
  );
}
