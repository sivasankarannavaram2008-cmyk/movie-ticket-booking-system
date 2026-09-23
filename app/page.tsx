"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { HeroCarousel } from "@/components/ui/HeroCarousel";
import { MovieCard } from "@/components/movies/MovieCard";
import { MOCK_MOVIES, CITIES, RichMovie } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useCity } from "@/context/CityContext";
import { Filter, Clapperboard, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

function HomeContent() {
  const searchParams = useSearchParams();
  const { selectedCity, setCity } = useCity();

  const paramCity = searchParams.get("city") || searchParams.get("citySlug");
  const citySlug = paramCity || selectedCity.slug || "hyderabad";
  const currentCity = CITIES.find((c) => c.slug.toLowerCase() === citySlug.toLowerCase()) || selectedCity;

  // Sync if URL has explicit city param that differs from context
  useEffect(() => {
    if (paramCity && paramCity.toLowerCase() !== selectedCity.slug.toLowerCase()) {
      setCity(paramCity);
    }
  }, [paramCity, selectedCity.slug, setCity]);

  const [activeTab, setActiveTab] = useState<"now_showing" | "coming_soon">("now_showing");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [selectedFormat, setSelectedFormat] = useState<string>("All");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");

  const [movies, setMovies] = useState<RichMovie[]>(MOCK_MOVIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);

  // Fetch from Supabase with fallback to rich mock data
  useEffect(() => {
    async function loadMovies() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from("movies").select("*");
        if (!error && data && data.length > 0) {
          // Merge database records with rich display attributes
          const formatted: RichMovie[] = data.map((dbMovie, idx) => {
            const fallback = MOCK_MOVIES[idx % MOCK_MOVIES.length];
            return {
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
              isComingSoon: idx > 6,
            };
          });
          setMovies(formatted);
          setIsLiveDb(true);
        } else {
          setMovies(MOCK_MOVIES);
          setIsLiveDb(false);
        }
      } catch (err) {
        console.warn("Using fallback mock movies:", err);
        setMovies(MOCK_MOVIES);
        setIsLiveDb(false);
      } finally {
        setIsLoading(false);
      }
    }

    loadMovies();
  }, []);

  // Category filters
  const languagesList = ["All", "Hindi", "Telugu", "Tamil", "Kannada", "Malayalam", "English"];
  const formatsList = ["All", "IMAX", "4DX", "2D", "3D"];
  const genresList = ["All", "Action", "Sci-Fi", "Comedy", "Thriller", "Drama", "Mythology"];

  // Filtered Movie List
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // Tab filter
      if (activeTab === "coming_soon" && !movie.isComingSoon) return false;
      if (activeTab === "now_showing" && movie.isComingSoon) return false;

      // Language filter
      if (
        selectedLanguage !== "All" &&
        !movie.languages.some((l) => l.toLowerCase() === selectedLanguage.toLowerCase())
      ) {
        return false;
      }

      // Format filter
      if (
        selectedFormat !== "All" &&
        !movie.formats.some((f) => f.toUpperCase().includes(selectedFormat.toUpperCase()))
      ) {
        return false;
      }

      // Genre filter
      if (
        selectedGenre !== "All" &&
        !movie.genre.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
      ) {
        return false;
      }

      return true;
    });
  }, [movies, activeTab, selectedLanguage, selectedFormat, selectedGenre]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Featured Titles Hero Carousel */}
      <HeroCarousel movies={movies} citySlug={citySlug} />

      {/* Main Content Section */}
      <div className="space-y-6">
        {/* Header Bar with Tabs and City Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Clapperboard className="w-6 h-6 text-primary" />
              Movies in <span className="text-primary underline decoration-primary/40 underline-offset-4">{currentCity.name}</span>
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              {filteredMovies.length} Titles
            </span>
          </div>

          {/* Now Showing vs Coming Soon Tabs */}
          <div className="flex items-center bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setActiveTab("now_showing")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "now_showing"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Now Showing
            </button>
            <button
              onClick={() => setActiveTab("coming_soon")}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "coming_soon"
                  ? "bg-primary text-white shadow-md shadow-primary/25"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Coming Soon
            </button>
          </div>
        </div>

        {/* Dynamic Category Filter Strips */}
        <div className="space-y-3 bg-zinc-950/70 border border-zinc-850 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Filter className="w-3.5 h-3.5 text-primary" />
            Filters
          </div>

          {/* Languages Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 w-20 shrink-0">Languages:</span>
            <div className="flex flex-wrap gap-1.5">
              {languagesList.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedLanguage === lang
                      ? "bg-white text-black font-bold shadow-sm"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Formats Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 w-20 shrink-0">Formats:</span>
            <div className="flex flex-wrap gap-1.5">
              {formatsList.map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormat(fmt)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedFormat === fmt
                      ? "bg-primary text-white font-bold shadow-sm shadow-primary/30"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Genres Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 w-20 shrink-0">Genres:</span>
            <div className="flex flex-wrap gap-1.5">
              {genresList.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    selectedGenre === genre
                      ? "bg-zinc-200 text-black font-bold"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Movies Grid / Loading Skeletons / Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-zinc-900/60 border border-zinc-800 overflow-hidden animate-pulse"
              >
                <div className="aspect-[2/3] bg-zinc-800 w-full" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                  <div className="h-8 bg-zinc-800 rounded w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} {...movie} citySlug={citySlug} />
            ))}
          </div>
        ) : (
          <div className="py-16 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950 p-8 space-y-4">
            <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Movies Found</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              No titles match your selected filters in {currentCity.name}. Try resetting your language, format, or genre filters.
            </p>
            <button
              onClick={() => {
                setSelectedLanguage("All");
                setSelectedFormat("All");
                setSelectedGenre("All");
              }}
              className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-96 w-full bg-zinc-900/50 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
