"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Clock, Ticket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichMovie } from "@/lib/mock-data";
import { useCity } from "@/context/CityContext";

interface HeroCarouselProps {
  movies: RichMovie[];
  citySlug?: string;
}

export function HeroCarousel({ movies, citySlug: propCitySlug }: HeroCarouselProps) {
  const { selectedCity } = useCity();
  const activeCitySlug = propCitySlug || selectedCity?.slug || "hyderabad";
  const featuredMovies = movies.slice(0, 5);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotation every 6 seconds
  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredMovies.length]);

  if (featuredMovies.length === 0) return null;

  const current = featuredMovies[currentIndex];
  const hours = Math.floor(current.duration_min / 60);
  const minutes = current.duration_min % 60;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 h-[340px] sm:h-[420px] lg:h-[480px]">
      {/* Background Backdrop Image */}
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.backdrop_url}
          alt={current.title}
          className="w-full h-full object-cover object-center opacity-40 transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-zinc-950/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent w-full md:w-3/4" />
      </div>

      {/* Slide Content */}
      <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col justify-end pb-10 md:pb-14 z-10">
        <div className="max-w-2xl space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 border border-primary/40 text-xs font-semibold text-primary">
              <Sparkles className="w-3 h-3" />
              Featured Release
            </span>
            <span className="px-2 py-0.5 rounded bg-black/60 border border-white/20 text-xs font-bold text-white uppercase">
              {current.censor_rating}
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
              <Star className="w-3.5 h-3.5 fill-yellow-400" />
              <span>{current.rating.toFixed(1)}/10</span>
              <span className="text-zinc-400 font-normal">({current.votes} votes)</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {current.title}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-zinc-300">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              {hours}h {minutes}m
            </span>
            <span>•</span>
            <span>{current.genre.join(", ")}</span>
            <span>•</span>
            <span className="text-zinc-400">{current.languages.join(", ")}</span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 max-w-xl leading-relaxed">
            {current.synopsis}
          </p>

          <div className="flex items-center gap-3 pt-2">
            <Link href={`/movie/${current.id}?city=${encodeURIComponent(activeCitySlug)}`}>
              <Button size="lg" className="font-bold gap-2 bg-primary hover:bg-primary-hover shadow-lg shadow-primary/30">
                <Ticket className="w-4 h-4" />
                Book Tickets
              </Button>
            </Link>
            <div className="flex items-center gap-1.5 pl-2">
              {current.formats.map((fmt, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-md bg-zinc-900/80 border border-zinc-700 text-[11px] font-semibold text-zinc-300"
                >
                  {fmt}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() =>
          setCurrentIndex((prev) => (prev === 0 ? featuredMovies.length - 1 : prev - 1))
        }
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-zinc-700/80 text-white flex items-center justify-center transition-colors z-20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => setCurrentIndex((prev) => (prev + 1) % featuredMovies.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 border border-zinc-700/80 text-white flex items-center justify-center transition-colors z-20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 right-8 flex items-center gap-2 z-20">
        {featuredMovies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "w-6 bg-primary" : "w-2 bg-zinc-600 hover:bg-zinc-400"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
