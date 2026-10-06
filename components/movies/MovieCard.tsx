import React from "react";
import Link from "next/link";
import { Star, Clock, Ticket, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCity } from "@/context/CityContext";

export interface MovieCardProps {
  id: string;
  title: string;
  poster_url: string;
  genre: string[];
  duration_min: number;
  censor_rating: string;
  languages: string[];
  release_date?: string;
  formats?: string[];
  rating?: number;
  votes?: string;
  citySlug?: string;
  selectedDate?: string;
}

export function MovieCard({
  id,
  title,
  poster_url,
  genre,
  duration_min,
  censor_rating,
  languages,
  release_date,
  formats = ["2D", "IMAX"],
  rating = 8.5,
  votes = "120K",
  citySlug: propCitySlug,
  selectedDate,
}: MovieCardProps) {
  const { selectedCity } = useCity();
  const activeCitySlug = propCitySlug || selectedCity?.slug || "vellore";
  const hours = Math.floor(duration_min / 60);
  const minutes = duration_min % 60;
  const durationText = `${hours}h ${minutes}m`;

  const targetUrl = `/movie/${id}?city=${encodeURIComponent(activeCitySlug)}${
    selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : ""
  }`;

  // Formatted release year or date
  const releaseYear = release_date ? new Date(release_date).getFullYear() : "2025-2026";

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-900/50 border border-zinc-800/80 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
      {/* Poster Media Box with 2:3 Aspect Ratio */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster_url}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Ambient Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-black/40 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          {/* Censor Rating */}
          <span className="bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black text-white border border-white/15 uppercase tracking-wider shadow">
            {censor_rating}
          </span>

          {/* Star Rating */}
          <div className="bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold text-amber-400 border border-amber-400/20 shadow">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-[9px] text-zinc-400 font-normal">({votes})</span>
          </div>
        </div>

        {/* Release Tag Pill */}
        <div className="absolute top-9 left-2.5 pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-semibold text-zinc-300 border border-zinc-700/60 shadow">
            <Calendar className="w-2.5 h-2.5 text-primary" />
            {releaseYear}
          </span>
        </div>

        {/* Languages Strip at bottom of poster */}
        <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between text-[11px] text-zinc-300 font-medium">
          <span className="truncate max-w-[70%] drop-shadow">
            {languages.slice(0, 3).join(", ")}
            {languages.length > 3 ? ` +${languages.length - 3}` : ""}
          </span>
          <span className="flex items-center gap-1 text-zinc-300 text-[10px] bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
            <Clock className="w-2.5 h-2.5 text-zinc-400" />
            {durationText}
          </span>
        </div>
      </div>

      {/* Movie Details Info */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-3 bg-zinc-900/60 backdrop-blur-sm">
        <div className="space-y-1.5">
          <Link
            href={targetUrl}
            className="block font-black text-white text-base sm:text-lg leading-snug group-hover:text-primary transition-colors line-clamp-1"
          >
            {title}
          </Link>

          {/* Genre & Formats Strip */}
          <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
            <span className="truncate text-[11px] font-medium text-zinc-400">
              {genre.slice(0, 2).join(" • ")}
            </span>
          </div>

          {/* Formats Badges */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {formats.slice(0, 3).map((fmt, idx) => (
              <span
                key={idx}
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/90 text-zinc-300 border border-zinc-700/50"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <Link href={targetUrl} className="w-full pt-1">
          <Button
            size="sm"
            className="w-full font-bold text-xs gap-1.5 bg-gradient-to-r from-primary via-rose-600 to-amber-500 hover:from-primary-hover hover:to-amber-600 text-white shadow-md shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 group-hover:scale-[1.02]"
          >
            <Ticket className="w-3.5 h-3.5" />
            Book Tickets
          </Button>
        </Link>
      </div>
    </div>
  );
}
