"use client";

import React, { useState } from "react";
import { Film, Clapperboard, Sparkles, Star, Calendar } from "lucide-react";

export interface MoviePosterProps {
  title: string;
  poster_url?: string | null;
  release_date?: string | null;
  censor_rating?: string | null;
  formats?: string[];
  genre?: string[];
  className?: string;
  aspectRatio?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showOverlayBadges?: boolean;
  showTitle?: boolean;
  showBottomDetails?: boolean;
}

export function MoviePoster({
  title,
  poster_url,
  release_date,
  censor_rating = "U/A",
  formats = ["2D", "IMAX", "Dolby Atmos"],
  genre = [],
  className = "",
  aspectRatio = "aspect-[2/3]",
  size = "md",
  showOverlayBadges = true,
  showTitle = true,
  showBottomDetails = true,
}: MoviePosterProps) {
  const [imgError, setImgError] = useState(false);

  // Extract release year
  const releaseYear = release_date
    ? new Date(release_date).getFullYear().toString()
    : "2026";

  const hasValidImage = Boolean(poster_url && poster_url.trim() !== "" && !imgError);

  // If a valid image URL exists, render image with automatic fallback
  if (hasValidImage) {
    return (
      <div className={`relative ${aspectRatio} w-full overflow-hidden rounded-2xl bg-zinc-950 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster_url!}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {/* Subtle dark vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/40 opacity-80 group-hover:opacity-60 transition-opacity" />
      </div>
    );
  }

  // Sizing adjustments for icon and fonts
  const iconSizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10 sm:w-12 sm:h-12",
    lg: "w-14 h-14",
    xl: "w-16 h-16",
  }[size];

  const titleSizeClasses = {
    sm: "text-xs font-bold leading-tight line-clamp-1",
    md: "text-sm sm:text-base font-black leading-snug line-clamp-2",
    lg: "text-lg sm:text-xl font-black leading-snug line-clamp-2",
    xl: "text-xl sm:text-2xl font-black leading-snug line-clamp-2",
  }[size];

  return (
    <div
      className={`relative ${aspectRatio} w-full overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-zinc-800/90 shadow-2xl flex flex-col justify-between p-4 sm:p-5 select-none transition-all duration-300 hover:border-zinc-700 hover:shadow-primary/10 ${className}`}
    >
      {/* Ambient Radial Glowing Meshes */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-gradient-to-br from-rose-600/20 to-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-gradient-to-tr from-primary/15 to-rose-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Subtle Cinema Grid Accent Lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* TOP STRIP: Badges */}
      {showOverlayBadges ? (
        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Censor Certification */}
          <span className="bg-zinc-900/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black text-zinc-300 border border-zinc-750 uppercase tracking-widest shadow-sm">
            {censor_rating || "U/A"}
          </span>

          {/* Release Year Chip */}
          <div className="inline-flex items-center gap-1 bg-amber-500/10 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-amber-400 border border-amber-500/20 shadow-sm">
            <Calendar className="w-2.5 h-2.5 text-amber-400" />
            <span>{releaseYear}</span>
          </div>
        </div>
      ) : (
        <div />
      )}

      {/* CENTER: Film Reel / Clapperboard SVG with Amber/Red Glow */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        <div className="relative flex items-center justify-center">
          {/* Ambient Glow Aura */}
          <div className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-rose-600/25 via-amber-500/20 to-transparent blur-xl pointer-events-none" />

          {/* Icon Plaque */}
          <div className="relative p-3.5 sm:p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 shadow-xl backdrop-blur-md group-hover:scale-105 group-hover:border-zinc-700 transition-all duration-300">
            <Clapperboard className={`${iconSizeClasses} text-amber-400/90 drop-shadow-[0_0_12px_rgba(245,158,11,0.35)]`} />
          </div>
        </div>

        {/* Cinematic watermarking pill */}
        <div className="mt-2.5 flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold text-zinc-500/80">
          <Film className="w-2.5 h-2.5 text-zinc-600" />
          <span>Cinematic Release</span>
        </div>
      </div>

      {/* BOTTOM STRIP: Title & Format Chips */}
      {showBottomDetails && (
        <div className="relative z-10 space-y-2 pt-2 border-t border-zinc-900/80">
          {showTitle && (
            <div>
              <h3 className={`${titleSizeClasses} text-white tracking-tight drop-shadow`}>
                {title}
              </h3>
              {genre && genre.length > 0 && size !== "sm" && (
                <p className="text-[10px] sm:text-[11px] font-medium text-zinc-400 truncate mt-0.5">
                  {genre.slice(0, 2).join(" • ")}
                </p>
              )}
            </div>
          )}

          {/* Format Chips (IMAX, 2D, Dolby Atmos) */}
          {size !== "sm" && formats && formats.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {formats.slice(0, 3).map((fmt, idx) => (
                <span
                  key={idx}
                  className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-900/90 text-zinc-300 border border-zinc-800 shadow-sm"
                >
                  {fmt}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
