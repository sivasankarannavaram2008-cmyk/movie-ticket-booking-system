"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Clock, Ticket, Sparkles, Film, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichMovie } from "@/lib/mock-data";
import { useCity } from "@/context/CityContext";

interface HeroCarouselProps {
  movies: RichMovie[];
  citySlug?: string;
  selectedDate?: string;
}

export function HeroCarousel({ movies, citySlug: propCitySlug, selectedDate }: HeroCarouselProps) {
  const { selectedCity } = useCity();
  const activeCitySlug = propCitySlug || selectedCity?.slug || "vellore";
  const featuredMovies = movies.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotation every 5 seconds (pauses on mouse hover)
  useEffect(() => {
    if (featuredMovies.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [featuredMovies.length, isPaused]);

  if (featuredMovies.length === 0) return null;

  const current = featuredMovies[currentIndex];
  const hours = Math.floor(current.duration_min / 60);
  const minutes = current.duration_min % 60;
  const releaseYear = current.release_date ? new Date(current.release_date).getFullYear() : "2025–2026";

  const bookingHref = `/movie/${current.id}?city=${encodeURIComponent(activeCitySlug)}${
    selectedDate ? `&date=${encodeURIComponent(selectedDate)}` : ""
  }`;

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950 shadow-2xl h-[420px] sm:h-[480px] lg:h-[540px] group/hero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Backdrop Image with Crossfade */}
      <div className="absolute inset-0 overflow-hidden">
        {featuredMovies.map((movie, idx) => (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
            } transform transition-transform duration-1000`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={movie.backdrop_url || movie.poster_url}
              alt={movie.title}
              className="w-full h-full object-cover object-center filter brightness-90"
            />
          </div>
        ))}

        {/* Cinematic Multi-layered Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 via-50% to-transparent w-full md:w-3/4" />
      </div>

      {/* Slide Content */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col justify-end pb-12 sm:pb-16 z-10">
        <div className="max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Badges Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary/30 to-amber-500/20 border border-primary/50 text-xs font-bold text-white shadow-lg shadow-primary/20 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              TRENDING BLOCKBUSTER
            </span>

            <span className="px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-white/20 text-xs font-black text-white uppercase tracking-wider">
              {current.censor_rating}
            </span>

            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-zinc-700 text-xs font-semibold text-zinc-300">
              <Calendar className="w-3 h-3 text-primary" />
              {releaseYear}
            </span>

            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-amber-400/25">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{current.rating.toFixed(1)}/10</span>
              <span className="text-zinc-400 font-normal hidden sm:inline">({current.votes})</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-md">
            {current.title}
          </h1>

          {/* Meta Information (Runtime, Genres, Languages) */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-zinc-300">
            <span className="flex items-center gap-1 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {hours}h {minutes}m
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-200">{current.genre.join(" / ")}</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">{current.languages.join(", ")}</span>
          </div>

          {/* Synopsis */}
          <p className="text-xs sm:text-sm text-zinc-300/90 line-clamp-2 sm:line-clamp-3 max-w-xl leading-relaxed drop-shadow">
            {current.synopsis}
          </p>

          {/* Action Buttons & Format Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href={bookingHref}>
              <Button
                size="lg"
                className="h-12 px-6 rounded-xl font-black text-sm gap-2.5 bg-gradient-to-r from-primary via-rose-600 to-amber-500 hover:from-primary-hover hover:to-amber-600 text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-300"
              >
                <Ticket className="w-5 h-5" />
                Book Now
              </Button>
            </Link>

            <Link href={bookingHref}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-5 rounded-xl font-bold text-sm gap-2 bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white backdrop-blur-md transition-colors"
              >
                <Film className="w-4 h-4 text-primary" />
                View Shows
              </Button>
            </Link>

            {/* Formats Pills */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2">
              {current.formats.map((fmt, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-md bg-zinc-900/90 backdrop-blur-md border border-zinc-750 text-[11px] font-bold text-zinc-300 shadow"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrow Controls */}
      <button
        onClick={() =>
          setCurrentIndex((prev) => (prev === 0 ? featuredMovies.length - 1 : prev - 1))
        }
        className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-zinc-700/80 text-white flex items-center justify-center transition-all opacity-0 group-hover/hero:opacity-100 z-20 backdrop-blur-md hover:scale-110"
        aria-label="Previous movie"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredMovies.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 border border-zinc-700/80 text-white flex items-center justify-center transition-all opacity-0 group-hover/hero:opacity-100 z-20 backdrop-blur-md hover:scale-110"
        aria-label="Next movie"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Bottom Thumbnail / Progress Strip */}
      <div className="absolute bottom-4 right-6 sm:right-12 flex items-center gap-2 z-20">
        {featuredMovies.map((movie, idx) => (
          <button
            key={movie.id}
            onClick={() => setCurrentIndex(idx)}
            className={`group/thumb flex items-center gap-2 px-2.5 py-1 rounded-full transition-all duration-300 backdrop-blur-md ${
              idx === currentIndex
                ? "bg-primary text-white font-bold shadow-lg shadow-primary/30 ring-1 ring-white/30"
                : "bg-black/50 hover:bg-black/80 text-zinc-400 hover:text-white border border-white/10"
            }`}
            aria-label={`Go to ${movie.title}`}
          >
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentIndex ? "bg-white" : "bg-zinc-500 group-hover/thumb:bg-zinc-300"
              }`}
            />
            <span className="text-[11px] max-w-[100px] truncate hidden md:inline">
              {movie.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
