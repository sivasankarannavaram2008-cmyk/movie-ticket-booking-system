"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HeroCarousel } from "@/components/ui/HeroCarousel";
import { MovieCard } from "@/components/movies/MovieCard";
import { MOCK_MOVIES, RichMovie } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useCity } from "@/context/CityContext";
import {
  Filter,
  Clapperboard,
  Sparkles,
  AlertCircle,
  Search,
  MapPin,
  Calendar,
  ChevronDown,
  X,
  Flame,
  Check,
} from "lucide-react";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedCity, setCity, cities } = useCity();

  // URL City synchronization
  const paramCity = searchParams.get("city") || searchParams.get("citySlug");
  const citySlug = paramCity || selectedCity.slug || "vellore";

  useEffect(() => {
    if (paramCity && paramCity.toLowerCase() !== selectedCity.slug.toLowerCase()) {
      setCity(paramCity);
    }
  }, [paramCity, selectedCity.slug, setCity]);

  // City Selector Dropdown State
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);

  // Quick Movie Search
  const [searchQuery, setSearchQuery] = useState("");

  // Upcoming 7-day Date Selector
  const upcomingDates = useMemo(() => {
    const list = [];
    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      let dayLabel = dayNames[d.getDay()];
      if (i === 0) dayLabel = "Today";
      else if (i === 1) dayLabel = "Tomorrow";

      list.push({
        dateStr,
        dayLabel,
        dateNum: dd,
        monthName: monthNames[d.getMonth()],
        isToday: i === 0,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return list;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(upcomingDates[0]?.dateStr || "");

  // Filters State
  const [activeTab, setActiveTab] = useState<"all" | "now_showing" | "coming_soon">("all");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("All");
  const [selectedFormat, setSelectedFormat] = useState<string>("All");

  // Movies Catalog State
  const [movies, setMovies] = useState<RichMovie[]>(MOCK_MOVIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load Movies from Supabase with title matching to rich metadata
  useEffect(() => {
    async function loadMovies() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from("movies").select("*");
        if (!error && data && data.length > 0) {
          const formatted: RichMovie[] = data.map((dbMovie, idx) => {
            const matchedMock =
              MOCK_MOVIES.find(
                (m) => m.title.trim().toLowerCase() === dbMovie.title.trim().toLowerCase()
              ) || MOCK_MOVIES[idx % MOCK_MOVIES.length];

            return {
              id: dbMovie.id,
              title: dbMovie.title,
              poster_url: dbMovie.poster_url || matchedMock.poster_url,
              backdrop_url: dbMovie.backdrop_url || matchedMock.backdrop_url,
              genre:
                dbMovie.genre && dbMovie.genre.length > 0 ? dbMovie.genre : matchedMock.genre,
              duration_min: dbMovie.duration_min || matchedMock.duration_min,
              release_date: dbMovie.release_date || matchedMock.release_date,
              censor_rating: dbMovie.censor_rating || matchedMock.censor_rating,
              languages:
                dbMovie.languages && dbMovie.languages.length > 0
                  ? dbMovie.languages
                  : matchedMock.languages,
              formats: matchedMock.formats,
              rating: matchedMock.rating,
              votes: matchedMock.votes,
              synopsis: matchedMock.synopsis,
              isComingSoon: matchedMock.isComingSoon || false,
            };
          });
          setMovies(formatted);
        } else {
          setMovies(MOCK_MOVIES);
        }
      } catch (err) {
        console.warn("Using fallback mock movies:", err);
        setMovies(MOCK_MOVIES);
      } finally {
        setIsLoading(false);
      }
    }

    loadMovies();
  }, []);

  // Filter Categories
  const genresList = [
    "All",
    "Action",
    "Drama",
    "Thriller",
    "Comedy",
    "Fantasy",
    "Crime",
    "Period",
    "Romance",
    "Legal",
  ];
  const languagesList = ["All", "Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"];
  const formatsList = ["All", "IMAX", "4DX", "2D", "Dolby Atmos"];

  // Filtered Movie Slate
  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = movie.title.toLowerCase().includes(q);
        const matchesGenre = movie.genre.some((g) => g.toLowerCase().includes(q));
        const matchesLanguage = movie.languages.some((l) => l.toLowerCase().includes(q));
        const matchesSynopsis = movie.synopsis?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesGenre && !matchesLanguage && !matchesSynopsis) {
          return false;
        }
      }

      // Tab filter
      if (activeTab === "coming_soon" && !movie.isComingSoon) return false;
      if (activeTab === "now_showing" && movie.isComingSoon) return false;

      // Genre filter
      if (
        selectedGenre !== "All" &&
        !movie.genre.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())
      ) {
        return false;
      }

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

      return true;
    });
  }, [movies, searchQuery, activeTab, selectedGenre, selectedLanguage, selectedFormat]);

  const activeFiltersCount =
    (selectedGenre !== "All" ? 1 : 0) +
    (selectedLanguage !== "All" ? 1 : 0) +
    (selectedFormat !== "All" ? 1 : 0) +
    (activeTab !== "all" ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedGenre("All");
    setSelectedLanguage("All");
    setSelectedFormat("All");
    setActiveTab("all");
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-primary selection:text-white pb-16">
      {/* Background Ambient Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-rose-950/20 via-primary/5 to-transparent blur-3xl opacity-60" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-8">
        {/* ================================================================== */}
        {/* SECTION 1: City & Search Control Bar */}
        {/* ================================================================== */}
        <div className="relative rounded-2xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md p-3 sm:p-4 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* City Picker Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCityDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 text-sm font-semibold text-white transition-all hover:bg-zinc-900 group"
              aria-label="Choose City"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="text-left leading-none">
                <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                  Location
                </span>
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                  {selectedCity.name}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                  isCityDropdownOpen ? "rotate-180 text-white" : ""
                }`}
              />
            </button>

            {/* City Dropdown Menu */}
            {isCityDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsCityDropdownOpen(false)}
                />
                <div className="absolute top-14 left-0 w-64 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-3 py-2 border-b border-zinc-850">
                    Select Cinema City
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1 divide-y divide-zinc-900">
                    {cities.map((city) => {
                      const isSelected = city.slug === selectedCity.slug;
                      return (
                        <button
                          key={city.id}
                          onClick={() => {
                            setCity(city);
                            setIsCityDropdownOpen(false);
                            router.push(`/?city=${city.slug}`);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all ${
                            isSelected
                              ? "bg-primary text-white shadow-md shadow-primary/20"
                              : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                          }`}
                        >
                          <div>
                            <span className="block font-bold">{city.name}</span>
                            <span className={`text-[10px] ${isSelected ? "text-white/80" : "text-zinc-500"}`}>
                              {city.state}
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Real-time Movie Catalog Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search 2025–2026 releases by title, genre, or star..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-zinc-950/80 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Slate Stat Counter */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs font-semibold text-zinc-300 shrink-0">
            <Flame className="w-4 h-4 text-primary animate-pulse" />
            <span>
              <strong className="text-white">{filteredMovies.length}</strong> Titles Scheduled
            </span>
          </div>
        </div>

        {/* ================================================================== */}
        {/* SECTION 2: Hero Carousel Banner */}
        {/* ================================================================== */}
        <HeroCarousel
          movies={movies}
          citySlug={selectedCity.slug}
          selectedDate={selectedDate}
        />

        {/* ================================================================== */}
        {/* SECTION 3: Date Selector Strip */}
        {/* ================================================================== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Choose Showtime Date
            </h2>
            <span className="text-xs text-zinc-500 hidden sm:inline">
              Selected: <strong className="text-zinc-200">{selectedDate}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
            {upcomingDates.map((item) => {
              const isSelected = item.dateStr === selectedDate;
              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[76px] sm:min-w-[88px] px-3 py-2.5 rounded-2xl border transition-all duration-200 shrink-0 select-none ${
                    isSelected
                      ? "bg-gradient-to-b from-primary to-rose-700 border-primary text-white shadow-lg shadow-primary/30 scale-105"
                      : "bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isSelected ? "text-white" : item.isToday ? "text-primary" : "text-zinc-400"
                    }`}
                  >
                    {item.dayLabel}
                  </span>
                  <span className="text-lg sm:text-xl font-black leading-tight my-0.5">
                    {item.dateNum}
                  </span>
                  <span
                    className={`text-[10px] font-semibold uppercase ${
                      isSelected ? "text-white/80" : "text-zinc-400"
                    }`}
                  >
                    {item.monthName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================== */}
        {/* SECTION 4: Genre & Category Navigation Strips */}
        {/* ================================================================== */}
        <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-sm p-4 space-y-4 shadow-lg">
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-850 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <Filter className="w-4 h-4 text-primary" />
              Movie Filters & Categories
              {activeFiltersCount > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[10px] font-black">
                  {activeFiltersCount} Active
                </span>
              )}
            </div>

            {/* Releases Tab Switcher */}
            <div className="flex items-center bg-zinc-950/80 border border-zinc-800 p-1 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "all"
                    ? "bg-zinc-800 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All Releases
              </button>
              <button
                onClick={() => setActiveTab("now_showing")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "now_showing"
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                In Cinemas
              </button>
              <button
                onClick={() => setActiveTab("coming_soon")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "coming_soon"
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Coming Soon
              </button>
            </div>
          </div>

          {/* Genre Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-400 w-16 shrink-0">Genres:</span>
            <div className="flex flex-wrap gap-1.5">
              {genresList.map((genre) => {
                const isActive = selectedGenre === genre;
                return (
                  <button
                    key={genre}
                    onClick={() => setSelectedGenre(genre)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-white text-black shadow-md scale-105"
                        : "bg-zinc-950/70 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    {genre}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language & Format Strips */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1 border-t border-zinc-850/60">
            {/* Languages */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 w-16 shrink-0">Languages:</span>
              <div className="flex flex-wrap gap-1.5">
                {languagesList.map((lang) => {
                  const isActive = selectedLanguage === lang;
                  return (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                        isActive
                          ? "bg-primary text-white font-bold shadow-sm shadow-primary/30"
                          : "bg-zinc-950/70 border border-zinc-800/80 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formats */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-zinc-400 shrink-0">Formats:</span>
              <div className="flex flex-wrap gap-1.5">
                {formatsList.map((fmt) => {
                  const isActive = selectedFormat === fmt;
                  return (
                    <button
                      key={fmt}
                      onClick={() => setSelectedFormat(fmt)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                        isActive
                          ? "bg-amber-400 text-black font-bold shadow-sm"
                          : "bg-zinc-950/70 border border-zinc-800/80 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {fmt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Reset Filters Option */}
          {activeFiltersCount > 0 && (
            <div className="flex justify-end pt-1">
              <button
                onClick={resetAllFilters}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* SECTION 5: Movie Showcase Grid */}
        {/* ================================================================== */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                <Clapperboard className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                2025–2026 Telugu Cinema Slate
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Browse formats, book tickets, and reserve your seats across theaters in{" "}
                <span className="text-primary font-bold">{selectedCity.name}</span>.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
              {filteredMovies.length} Available
            </span>
          </div>

          {/* Loading Skeletons */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-zinc-900/40 border border-zinc-800/80 overflow-hidden animate-pulse"
                >
                  <div className="aspect-[2/3] bg-zinc-800/60 w-full" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    <div className="h-9 bg-zinc-800 rounded-xl w-full mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMovies.length > 0 ? (
            /* Movie Cards Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {filteredMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  {...movie}
                  citySlug={selectedCity.slug}
                  selectedDate={selectedDate}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-16 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 p-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-500 mx-auto">
                <AlertCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-black text-white">No Movies Match Your Filter</h3>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                We couldn&apos;t find any titles matching &quot;{searchQuery || selectedGenre}&quot; in{" "}
                {selectedCity.name}. Try adjusting your filters or search query.
              </p>
              <button
                onClick={resetAllFilters}
                className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-xs font-bold text-white shadow-lg shadow-primary/25 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#09090b] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="h-16 w-full bg-zinc-900/40 rounded-2xl animate-pulse" />
          <div className="h-[480px] w-full bg-zinc-900/40 rounded-3xl animate-pulse" />
          <div className="h-20 w-full bg-zinc-900/40 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-zinc-900/40 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
