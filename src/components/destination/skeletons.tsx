"use client";

/**
 * Section-Specific Skeleton Components for OnlyExplore
 * 
 * Each skeleton precisely matches the dimensions and layout of its real counterpart
 * to prevent layout shift (CLS) during loading.
 * 
 * Design: Uses the same rounded corners, spacing, and glassmorphism
 * aesthetic as the real components to create a seamless shimmer → content transition.
 */

import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Shared Shimmer Primitive
// ─────────────────────────────────────────────────────────────────────────────

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-muted via-muted/60 to-muted bg-[length:200%_100%] rounded-xl ${className}`}
    />
  );
}

function ShimmerText({ className = '', width = 'w-32' }: { className?: string; width?: string }) {
  return <Shimmer className={`h-4 ${width} ${className}`} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function HeroSkeleton() {
  return (
    <div className="relative w-full h-[520px] md:h-[640px] flex items-end overflow-hidden rounded-b-[3rem] md:rounded-b-[4rem] bg-muted">
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="relative z-10 w-full px-6 md:px-16 pb-24 md:pb-32 space-y-6">
        <Shimmer className="h-6 w-48 rounded-full" />
        <Shimmer className="h-16 md:h-24 w-3/4 max-w-xl rounded-2xl" />
        <Shimmer className="h-6 w-2/3 max-w-lg rounded-xl" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Facts Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function QuickFactsSkeleton() {
  return (
    <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-card border border-border/30 rounded-[2rem] p-6 space-y-4">
          <Shimmer className="h-12 w-12 rounded-2xl" />
          <ShimmerText width="w-20" />
          <Shimmer className="h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Gallery Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function GallerySkeleton() {
  return (
    <div className="mt-20 mb-16 space-y-8">
      <div className="space-y-2">
        <Shimmer className="h-8 w-64 rounded-xl" />
        <ShimmerText width="w-48" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {[...Array(7)].map((_, idx) => (
          <Shimmer
            key={idx}
            className={`rounded-[2rem] ${idx === 0 ? 'col-span-2 row-span-2 h-[320px] md:h-[480px]' : 'h-[150px] md:h-[230px]'}`}
          />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Map Explorer Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function MapExplorerSkeleton() {
  return (
    <div className="mt-32 mb-16 space-y-8">
      <div className="space-y-4">
        <Shimmer className="h-6 w-40 rounded-full" />
        <Shimmer className="h-12 w-80 rounded-2xl" />
        <ShimmerText width="w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-[3.5rem] overflow-hidden border border-border/50 h-[500px]">
        <div className="lg:col-span-7">
          <Shimmer className="w-full h-full rounded-none" />
        </div>
        <div className="lg:col-span-5 p-8 space-y-6 bg-card">
          <Shimmer className="h-48 w-full rounded-[2rem]" />
          <ShimmerText width="w-40" />
          <Shimmer className="h-4 w-full" />
          <Shimmer className="h-4 w-3/4" />
          <div className="grid grid-cols-2 gap-4">
            <Shimmer className="h-20 rounded-3xl" />
            <Shimmer className="h-20 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Places Carousel Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function PlacesCarouselSkeleton() {
  return (
    <div className="mt-32 mb-32 space-y-12">
      <div className="space-y-4">
        <Shimmer className="h-6 w-48 rounded-full" />
        <Shimmer className="h-16 w-96 rounded-2xl" />
        <ShimmerText width="w-80" />
      </div>
      <div className="flex gap-4 sm:gap-6 overflow-hidden py-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-none w-[320px] sm:w-[380px] bg-card border border-border/50 rounded-[2rem] overflow-hidden">
            <Shimmer className="aspect-[16/10] w-full rounded-none" />
            <div className="p-5 space-y-3">
              <Shimmer className="h-4 w-full" />
              <Shimmer className="h-3 w-3/4" />
              <div className="flex justify-between pt-4 border-t border-border/50">
                <div className="flex gap-1.5">
                  <Shimmer className="h-5 w-14 rounded-md" />
                  <Shimmer className="h-5 w-14 rounded-md" />
                </div>
                <Shimmer className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activities Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function ActivitiesSkeleton() {
  return (
    <div className="mt-32 space-y-12">
      <div className="flex flex-col lg:flex-row justify-between gap-10">
        <div className="space-y-4 max-w-2xl">
          <Shimmer className="h-6 w-52 rounded-full" />
          <Shimmer className="h-16 w-96 rounded-2xl" />
          <ShimmerText width="w-64" />
        </div>
        <div className="flex flex-col gap-4">
          <Shimmer className="h-10 w-64 rounded-xl" />
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Shimmer key={i} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-4 sm:gap-6 overflow-hidden py-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-none w-[320px] sm:w-[380px] bg-card border border-border/50 rounded-[2rem] overflow-hidden">
            <Shimmer className="aspect-[16/10] w-full rounded-none" />
            <div className="p-6 space-y-4">
              <Shimmer className="h-3 w-full" />
              <Shimmer className="h-3 w-2/3" />
              <div className="flex justify-between pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <Shimmer className="h-3 w-16" />
                  <Shimmer className="h-6 w-24" />
                </div>
                <Shimmer className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hotels Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function HotelsSkeleton() {
  return (
    <div className="mt-32 space-y-12">
      <div className="space-y-4 max-w-2xl">
        <Shimmer className="h-6 w-48 rounded-full" />
        <Shimmer className="h-16 w-80 rounded-2xl" />
        <ShimmerText width="w-72" />
      </div>
      <div className="flex gap-4 sm:gap-6 overflow-hidden py-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-none w-[320px] sm:w-[380px] bg-card border border-border/50 rounded-[2rem] overflow-hidden">
            <Shimmer className="aspect-[16/10] w-full rounded-none" />
            <div className="p-6 space-y-4">
              <Shimmer className="h-3 w-full" />
              <div className="grid grid-cols-2 gap-2">
                {[...Array(4)].map((_, j) => (
                  <Shimmer key={j} className="h-4 w-full rounded" />
                ))}
              </div>
              <div className="flex justify-between pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <Shimmer className="h-3 w-16" />
                  <Shimmer className="h-6 w-24" />
                </div>
                <Shimmer className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Itinerary Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function ItinerarySkeleton() {
  return (
    <div className="mt-32 space-y-16">
      <div className="flex flex-col items-center text-center space-y-4">
        <Shimmer className="h-6 w-36 rounded-full" />
        <Shimmer className="h-16 w-96 rounded-2xl" />
        <ShimmerText width="w-80" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Shimmer key={i} className="h-24 w-full rounded-[2rem]" />
          ))}
        </div>
        <div className="lg:col-span-8 bg-card border border-border/50 rounded-[3.5rem] p-8 md:p-12 min-h-[600px] space-y-8">
          <Shimmer className="h-12 w-72 rounded-2xl" />
          <div className="flex gap-3">
            {[...Array(3)].map((_, i) => (
              <Shimmer key={i} className="h-7 w-28 rounded-full" />
            ))}
          </div>
          <div className="space-y-10 pl-12">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Shimmer className="h-5 w-16" />
                <Shimmer className="h-6 w-48 rounded-lg" />
                <Shimmer className="h-4 w-full max-w-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Travel Preparation Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function PreparationSkeleton() {
  return (
    <div className="mt-32 space-y-16">
      <div className="flex flex-col items-center text-center space-y-4">
        <Shimmer className="h-6 w-40 rounded-full" />
        <Shimmer className="h-16 w-80 rounded-2xl" />
        <ShimmerText width="w-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 bg-card border border-border/50 rounded-[3.5rem] p-8 md:p-12 space-y-8">
          <div className="flex justify-between">
            <div className="flex items-center gap-4">
              <Shimmer className="h-12 w-12 rounded-2xl" />
              <Shimmer className="h-7 w-48" />
            </div>
            <Shimmer className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Shimmer className="h-4 w-24" />
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <Shimmer className="h-5 w-5 rounded-md" />
                    <Shimmer className="h-4 w-32" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 space-y-6">
          {[...Array(3)].map((_, i) => (
            <Shimmer key={i} className="h-40 w-full rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Trip Planner CTA Skeleton
// ─────────────────────────────────────────────────────────────────────────────

export function TripPlannerSkeleton() {
  return (
    <div className="w-full rounded-[2rem] p-8 md:p-12 mt-16 bg-muted/30 border border-border/50">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="flex-1 space-y-5">
          <Shimmer className="h-6 w-48 rounded-full" />
          <Shimmer className="h-12 w-80 rounded-2xl" />
          <Shimmer className="h-4 w-64" />
          <div className="flex flex-col gap-3">
            {[...Array(3)].map((_, i) => (
              <Shimmer key={i} className="h-10 w-full max-w-md rounded-full" />
            ))}
          </div>
        </div>
        <Shimmer className="hidden lg:block w-[300px] h-[300px] rounded-2xl" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Loading Wrapper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps a section with a loading/loaded transition.
 * Shows skeleton while loading, cross-fades to real content when ready.
 */
export function SectionLoader({
  loading,
  skeleton,
  children,
}: {
  loading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  if (loading) {
    return <div className="animate-in fade-in duration-300">{skeleton}</div>;
  }
  return <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">{children}</div>;
}
