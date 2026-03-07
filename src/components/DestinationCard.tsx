"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

interface DestinationCardProps {
  name: string;
  image: string;
}

export function DestinationCard({ name, image }: DestinationCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/chat?destination=${encodeURIComponent(name)}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-[200px] sm:w-[240px] md:w-[280px] shrink-0"
    >
      <div className="relative h-48 sm:h-56 md:h-64 mt-[1px]">
        {/* Placeholder gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900" />
        
        {/* Image element */}
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          sizes="(max-width: 768px) 200px, 280px"
        />

        {/* Gradient Overlay for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
        
        <div className="absolute bottom-0 left-0 p-4 sm:p-5">
          <h3 className="text-white font-headline text-lg sm:text-xl font-semibold leading-tight drop-shadow-md">
            {name}
          </h3>
        </div>
      </div>
    </div>
  );
}
