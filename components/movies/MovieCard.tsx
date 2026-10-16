import React from "react";
import Link from "next/link";
import { Clock, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCity } from "@/context/CityContext";
import { MoviePoster } from "@/components/MoviePoster";

export interface MovieCardProps {
  id: string;
  title: string;
  poster_url?: string | null;
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

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-zinc-900/50 border border-zinc-800/80 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
      {/* Poster Media Box with 2:3 Aspect Ratio */}
      <Link href={targetUrl} className="block relative">
        <MoviePoster
          title={title}
          poster_url={poster_url}
          release_date={release_date}
          censor_rating={censor_rating}
          formats={formats}
          genre={genre}
          size="md"
        />
      </Link>

      {/* Card Details & Action Button */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5 bg-zinc-900/60 backdrop-blur-sm">
        {poster_url && (
          <Link
            href={targetUrl}
            className="block font-black text-white text-base leading-snug group-hover:text-primary transition-colors line-clamp-1"
          >
            {title}
          </Link>
        )}

        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="truncate text-[11px] font-medium text-zinc-300">
            {languages.slice(0, 2).join(", ")}
            {languages.length > 2 ? ` +${languages.length - 2}` : ""}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800 shrink-0">
            <Clock className="w-2.5 h-2.5 text-zinc-500" />
            {durationText}
          </span>
        </div>

        {/* Action Button */}
        <Link href={targetUrl} className="w-full pt-0.5">
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
