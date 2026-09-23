import React from "react";
import Link from "next/link";
import { Star, Clock, Ticket } from "lucide-react";
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
  formats?: string[];
  rating?: number;
  votes?: string;
  citySlug?: string;
}

export function MovieCard({
  id,
  title,
  poster_url,
  genre,
  duration_min,
  censor_rating,
  languages,
  formats = ["2D", "IMAX"],
  rating = 8.5,
  votes = "120K",
  citySlug: propCitySlug,
}: MovieCardProps) {
  const { selectedCity } = useCity();
  const activeCitySlug = propCitySlug || selectedCity?.slug || "hyderabad";
  const hours = Math.floor(duration_min / 60);
  const minutes = duration_min % 60;
  const durationText = `${hours}h ${minutes}m`;

  return (
    <div className="group flex flex-col rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-850 hover:border-zinc-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/60">
      {/* Poster Media Box with 2:3 Aspect Ratio */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster_url}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Censor Rating Badge */}
        <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold text-white border border-white/10 uppercase tracking-wide">
          {censor_rating}
        </div>

        {/* Star Rating Badge */}
        <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1 text-xs font-bold text-yellow-400 border border-yellow-400/20">
          <Star className="w-3.5 h-3.5 fill-yellow-400" />
          <span>{rating.toFixed(1)}</span>
          <span className="text-[10px] text-zinc-400 font-normal">({votes})</span>
        </div>

        {/* Audio Languages Strip */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-2.5 pt-6 flex flex-wrap gap-1 items-center">
          <span className="text-[11px] text-zinc-300 font-medium">
            {languages.slice(0, 3).join(", ")}
            {languages.length > 3 ? ` +${languages.length - 3}` : ""}
          </span>
        </div>
      </div>

      {/* Movie Details Info */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div className="space-y-1.5">
          <Link
            href={`/movie/${id}?city=${encodeURIComponent(activeCitySlug)}`}
            className="block font-bold text-white text-base leading-snug group-hover:text-primary transition-colors line-clamp-1"
          >
            {title}
          </Link>

          {/* Formats Tags */}
          <div className="flex flex-wrap gap-1">
            {formats.slice(0, 3).map((fmt, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60"
              >
                {fmt}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
            <span className="truncate max-w-[140px]">{genre.slice(0, 2).join(", ")}</span>
            <span className="flex items-center gap-1 shrink-0">
              <Clock className="w-3 h-3 text-zinc-500" />
              {durationText}
            </span>
          </div>
        </div>

        {/* Action Trigger */}
        <Link href={`/movie/${id}?city=${encodeURIComponent(activeCitySlug)}`} className="w-full">
          <Button
            size="sm"
            className="w-full font-semibold gap-1.5 bg-primary hover:bg-primary-hover text-white shadow-md shadow-primary/20"
          >
            <Ticket className="w-3.5 h-3.5" />
            Book Tickets
          </Button>
        </Link>
      </div>
    </div>
  );
}
