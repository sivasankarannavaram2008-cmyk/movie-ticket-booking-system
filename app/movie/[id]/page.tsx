"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  Star,
  Clock,
  Calendar,
  MapPin,
  Heart,
  Share2,
  Info,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MOCK_MOVIES,
  CITIES,
  RichMovie,
  getMockCinemaShowtimes,
  CinemaShowGroup,
} from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useCity } from "@/context/CityContext";

function MovieDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedCity, setCity } = useCity();

  const movieId = (params.id as string) || "m-1";
  const paramCity = searchParams.get("city") || searchParams.get("citySlug");
  const citySlug = paramCity || selectedCity.slug || "hyderabad";
  const currentCity = CITIES.find((c) => c.slug.toLowerCase() === citySlug.toLowerCase()) || selectedCity;

  // Sync if URL has explicit city param that differs from context
  useEffect(() => {
    if (paramCity && paramCity.toLowerCase() !== selectedCity.slug.toLowerCase()) {
      setCity(paramCity);
    }
  }, [paramCity, selectedCity.slug, setCity]);

  // Date picker: Today, Tomorrow, Day After
  const dateOptions = useMemo(() => {
    const today = new Date();
    return [0, 1, 2].map((offset) => {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);

      const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const monthNames = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];

      const dayLabel = offset === 0 ? "TODAY" : offset === 1 ? "TOM" : dayNames[d.getDay()];

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const isoDate = `${yyyy}-${mm}-${dd}`;

      return {
        iso: isoDate,
        dayLabel,
        dayNumber: d.getDate(),
        month: monthNames[d.getMonth()],
      };
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].iso);
  const [movie, setMovie] = useState<RichMovie | null>(null);
  const [cinemaGroups, setCinemaGroups] = useState<CinemaShowGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load movie and showtimes from Supabase with graceful fallback
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // 1. Fetch movie details
        const { data: dbMovie, error: movieError } = await supabase
          .from("movies")
          .select("*")
          .eq("id", movieId)
          .maybeSingle();

        if (dbMovie && !movieError) {
          const fallback = MOCK_MOVIES.find((m) => m.title === dbMovie.title) || MOCK_MOVIES[0];
          setMovie({
            id: dbMovie.id,
            title: dbMovie.title,
            poster_url: dbMovie.poster_url || fallback.poster_url,
            backdrop_url: dbMovie.backdrop_url || fallback.backdrop_url,
            genre: dbMovie.genre && dbMovie.genre.length > 0 ? dbMovie.genre : fallback.genre,
            duration_min: dbMovie.duration_min || fallback.duration_min,
            release_date: dbMovie.release_date || fallback.release_date,
            censor_rating: dbMovie.censor_rating || fallback.censor_rating,
            languages: dbMovie.languages && dbMovie.languages.length > 0 ? dbMovie.languages : fallback.languages,
            formats: fallback.formats,
            rating: fallback.rating,
            votes: fallback.votes,
            synopsis: fallback.synopsis,
          });
        } else {
          // Fallback to rich mock data
          const found = MOCK_MOVIES.find((m) => m.id === movieId) || MOCK_MOVIES[0];
          setMovie(found);
        }

        // 2. Fetch live showtimes from unified shows API (checks published store & Supabase)
        let liveLoaded = false;
        try {
          const res = await fetch(
            `/api/shows?movieId=${encodeURIComponent(movieId)}&city=${encodeURIComponent(citySlug)}&date=${encodeURIComponent(selectedDate)}`
          );
          if (res.ok) {
            const json = await res.json();
            if (json.groups && json.groups.length > 0) {
              setCinemaGroups(json.groups);
              liveLoaded = true;
            }
          }
        } catch (apiErr) {
          console.warn("Showtimes API query notice:", apiErr);
        }

        if (!liveLoaded) {
          // Fallback to high-density cinema showtimes
          setCinemaGroups(getMockCinemaShowtimes(citySlug, selectedDate));
        }
      } catch (err) {
        console.warn("Using fallback showtimes:", err);
        setMovie(MOCK_MOVIES.find((m) => m.id === movieId) || MOCK_MOVIES[0]);
        setCinemaGroups(getMockCinemaShowtimes(citySlug, selectedDate));
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [movieId, selectedDate, citySlug]);

  if (isLoading || !movie) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-pulse">
        <div className="h-[380px] bg-zinc-900 rounded-2xl" />
        <div className="h-14 bg-zinc-900 rounded-xl" />
        <div className="space-y-4">
          <div className="h-28 bg-zinc-900 rounded-xl" />
          <div className="h-28 bg-zinc-900 rounded-xl" />
        </div>
      </div>
    );
  }

  const hours = Math.floor(movie.duration_min / 60);
  const minutes = movie.duration_min % 60;

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* 1. Cinematic Hero Banner */}
      <section className="relative overflow-hidden bg-zinc-950 border-b border-zinc-850">
        {/* Backdrop Image with Multi-Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={movie.backdrop_url}
            alt={movie.title}
            className="w-full h-full object-cover opacity-25 filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          {/* Breadcrumb back */}
          <Link
            href={`/?city=${encodeURIComponent(citySlug)}`}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Movies in {currentCity.name}
          </Link>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Poster Card */}
            <div className="relative aspect-[2/3] w-52 sm:w-64 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 shrink-0 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-2.5 left-2.5 bg-black/80 px-2 py-0.5 rounded text-xs font-bold text-white uppercase border border-white/10">
                {movie.censor_rating}
              </div>
            </div>

            {/* Movie Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  {movie.title}
                </h1>

                {/* Rating Strip */}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3.5 py-1.5 rounded-lg">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-lg font-black text-white">{movie.rating.toFixed(1)}/10</span>
                    <span className="text-xs text-zinc-400">({movie.votes} votes)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-zinc-700 transition-colors">
                      <Heart className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Formats & Languages */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {movie.formats.map((fmt, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-200"
                  >
                    {fmt}
                  </span>
                ))}
                <span className="text-zinc-600">•</span>
                <span className="text-sm font-medium text-zinc-300">
                  {movie.languages.join(", ")}
                </span>
              </div>

              {/* Duration, Genre, Release Date */}
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  {hours}h {minutes}m
                </span>
                <span>•</span>
                <span>{movie.genre.join(", ")}</span>
                <span>•</span>
                <span>Released: {movie.release_date}</span>
              </div>

              {/* Synopsis */}
              <div className="pt-2 max-w-3xl">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  About the Movie
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">{movie.synopsis}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Date Picker Bar */}
      <section className="sticky top-16 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
            {/* Date Pills */}
            <div className="flex items-center gap-2.5 shrink-0">
              {dateOptions.map((opt) => {
                const isSelected = selectedDate === opt.iso;
                return (
                  <button
                    key={opt.iso}
                    onClick={() => setSelectedDate(opt.iso)}
                    className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl text-center min-w-[72px] transition-all ${
                      isSelected
                        ? "bg-primary text-white font-bold shadow-lg shadow-primary/30 border border-primary"
                        : "bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span className="text-[10px] font-bold tracking-wider">{opt.dayLabel}</span>
                    <span className="text-lg font-black leading-tight">{opt.dayNumber}</span>
                    <span className="text-[9px] font-semibold">{opt.month}</span>
                  </button>
                );
              })}
            </div>

            {/* Urgency Legend */}
            <div className="hidden md:flex items-center gap-4 text-xs text-zinc-400 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Filling Fast</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Cinema Showtimes Grouping */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-base font-bold text-white">
              Theatres showing in <span className="text-primary">{currentCity.name}</span>
            </h2>
          </div>
          <span className="text-xs text-zinc-400">{cinemaGroups.length} Cinemas Available</span>
        </div>

        {cinemaGroups.length > 0 ? (
          <div className="space-y-4">
            {cinemaGroups.map((cinema) => (
              <div
                key={cinema.cinemaId}
                className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-5 hover:border-zinc-700 transition-all space-y-4"
              >
                {/* Cinema Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/60 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-zinc-500 hover:text-rose-500 cursor-pointer transition-colors" />
                      <h3 className="font-bold text-white text-base hover:text-primary transition-colors cursor-pointer">
                        {cinema.cinemaName}
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400 pl-6">{cinema.address}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400 pl-6 sm:pl-0">
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Cancellation Available
                    </span>
                    {cinema.distance && <span>• {cinema.distance}</span>}
                  </div>
                </div>

                {/* Showtimes Grid */}
                <div className="flex flex-wrap items-center gap-3">
                  {cinema.shows.map((show) => {
                    const isFillingFast = show.urgency === "filling_fast";

                    return (
                      <Link
                        key={show.showId}
                        href={`/booking/${show.showId}?city=${encodeURIComponent(citySlug)}&movieId=${movie.id}`}
                        className="group"
                      >
                        <div
                          className={`flex flex-col items-center justify-center px-4 py-2.5 rounded-xl border text-center transition-all cursor-pointer min-w-[105px] ${
                            isFillingFast
                              ? "border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-400 text-amber-300"
                              : "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/15 hover:border-emerald-400 text-emerald-300"
                          }`}
                        >
                          {/* Time */}
                          <span className="text-sm font-bold tracking-tight text-white group-hover:text-primary transition-colors">
                            {show.time}
                          </span>

                          {/* Format Badge */}
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase mt-0.5">
                            {show.formatBadge}
                          </span>

                          {/* Urgency / Price */}
                          <div className="flex items-center gap-1 mt-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isFillingFast ? "bg-amber-400" : "bg-emerald-400"
                              }`}
                            />
                            <span className="text-[10px] font-medium text-zinc-400">
                              ₹{show.price}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-8 space-y-3">
            <AlertCircle className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Shows Scheduled</h3>
            <p className="text-xs text-zinc-400">
              There are no screenings scheduled for this date in {currentCity.name}. Please select another date.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function MovieDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
          <div className="h-96 w-full bg-zinc-900 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <MovieDetailsContent />
    </Suspense>
  );
}
