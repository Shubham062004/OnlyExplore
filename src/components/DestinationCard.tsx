"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface DestinationCardProps {
  name: string;
  image: string;
  slug?: string;
}

export function DestinationCard({ name, image, slug }: DestinationCardProps) {
  const router = useRouter();
  const [imgSrc, setImgSrc] = useState(image);

  const destination = slug || name.toLowerCase().replace(/\s+/g, "-");
  const navigate = () => router.push(`/destination/${encodeURIComponent(destination)}`);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate();
    }
  };

  return (
    <div
      onClick={navigate}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View destination guide for ${name}`}
      className="group relative cursor-pointer rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 focus-visible:-translate-y-1 w-[200px] sm:w-[240px] md:w-[280px] shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-[4px] ring-offset-background"
    >
      <div className="relative h-48 sm:h-56 md:h-64 mt-[1px] overflow-hidden rounded-2xl">
        {/* Gradient placeholder background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900" />

        {/* Static local image — lazy loaded */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onError={() => setImgSrc("/assets/default.jpg")}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />

        {/* Gradient Overlay */}
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
