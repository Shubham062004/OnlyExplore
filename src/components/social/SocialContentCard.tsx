"use client";

/**
 * Social Content Card — Individual content card for Social Pulse.
 *
 * Displays:
 * - Thumbnail with platform badge overlay
 * - Content type badge
 * - Title & creator
 * - Published date & location
 * - Engagement metrics (only when legitimately available)
 * - "View on [Platform]" link
 * - Attribution text (when required)
 *
 * Design: OnlyExplore design system — white bg, soft purple accents,
 * rounded-[2rem] cards, glass-card aesthetic.
 */

import React, { useState } from "react";
import { ExternalLink, Eye, Heart, MessageCircle, Clock, MapPin } from "lucide-react";
import { PlatformBadge, ContentTypeBadge } from "./SocialSourceBadge";
import type { NormalizedSocialContent } from "@/services/social/socialTypes";

/** Formats a number with K/M suffix */
function formatCount(count: number | null): string | null {
  if (count === null || count === undefined) return null;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

/** Formats relative time */
function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/** Formats video duration */
function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}:${String(remainMins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400&auto=format&fit=crop";

export function SocialContentCard({ item }: { item: NormalizedSocialContent }) {
  const [imgSrc, setImgSrc] = useState(item.thumbnailUrl || FALLBACK_THUMBNAIL);
  const [imgError, setImgError] = useState(false);

  const relativeTime = formatRelativeTime(item.publishedAt);
  const formattedViews = formatCount(item.views);
  const formattedLikes = formatCount(item.likes);
  const formattedComments = formatCount(item.comments);
  const formattedDuration = formatDuration(item.duration);

  const platformLabel =
    item.platform.charAt(0).toUpperCase() + item.platform.slice(1).replace("_", " ");

  return (
    <div className="group bg-card rounded-[2rem] border border-border/50 shadow-xl shadow-black/5 overflow-hidden min-w-[280px] max-w-[320px] flex-shrink-0 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 hover:border-primary/30">
      {/* ── Thumbnail ──────────────────────────────────────────────────── */}
      <div className="relative w-full h-44 overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={item.title}
          onError={() => {
            if (!imgError) {
              setImgError(true);
              setImgSrc(FALLBACK_THUMBNAIL);
            }
          }}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Platform badge overlay (top-left) */}
        <div className="absolute top-3 left-3">
          <PlatformBadge platform={item.platform} />
        </div>

        {/* Duration badge (bottom-right, for videos) */}
        {formattedDuration && (
          <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formattedDuration}
          </div>
        )}

        {/* Content type badge (top-right) */}
        <div className="absolute top-3 right-3">
          <ContentTypeBadge type={item.type} />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────── */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <h4 className="text-sm font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {item.title}
        </h4>

        {/* Author */}
        {item.author && (
          <p className="text-xs text-muted-foreground font-medium truncate">
            by{" "}
            {item.authorUrl ? (
              <a
                href={item.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary/80 hover:text-primary hover:underline transition-colors"
              >
                {item.author}
              </a>
            ) : (
              <span>{item.author}</span>
            )}
          </p>
        )}

        {/* Location & Date */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
          {item.locationName && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {item.locationName}
            </span>
          )}
          {relativeTime && (
            <span className="opacity-70">{relativeTime}</span>
          )}
        </div>

        {/* Engagement metrics — ONLY when legitimately available */}
        {(formattedViews || formattedLikes || formattedComments) && (
          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
            {formattedViews && (
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {formattedViews}
              </span>
            )}
            {formattedLikes && (
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {formattedLikes}
              </span>
            )}
            {formattedComments && (
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" />
                {formattedComments}
              </span>
            )}
          </div>
        )}

        {/* View on Platform link */}
        <a
          href={item.contentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 mt-2"
        >
          View on {platformLabel}
          <ExternalLink className="w-3 h-3" />
        </a>

        {/* Attribution (when required) */}
        {item.attributionRequired && item.attributionText && (
          <p className="text-[9px] text-muted-foreground/60 font-medium pt-1">
            {item.attributionText}
          </p>
        )}
      </div>
    </div>
  );
}
