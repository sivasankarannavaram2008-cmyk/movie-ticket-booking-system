"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Film,
  Ticket,
  Search,
  MapPin,
  ChevronDown,
  User,
  X,
  Sparkles,
  Clapperboard,
  Building2,
} from "lucide-react";
import { CITIES, MOCK_MOVIES, MockCity } from "@/lib/mock-data";
import { useCity } from "@/context/CityContext";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { selectedCity, setCity, cities } = useCity();
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");

  const [globalSearch, setGlobalSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Sync city with URL search params if present
  useEffect(() => {
    const paramCity = searchParams.get("city") || searchParams.get("citySlug");
    if (paramCity && paramCity.toLowerCase() !== selectedCity.slug.toLowerCase()) {
      setCity(paramCity);
    }
  }, [searchParams, selectedCity.slug, setCity]);

  // Handle city selection
  const handleSelectCity = (city: MockCity) => {
    setCity(city);
    setIsCityModalOpen(false);

    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("city", city.slug);
    router.push(`${pathname}?${currentParams.toString()}`);
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered search results
  const filteredMovies = globalSearch.trim()
    ? MOCK_MOVIES.filter((m) =>
        m.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
        m.genre.some((g) => g.toLowerCase().includes(globalSearch.toLowerCase()))
      ).slice(0, 5)
    : [];

  const filteredCinemas = globalSearch.trim()
    ? [
        "PVR INOX Palladium",
        "Cinépolis Grand Mall",
        "INOX Megaplex",
        "Prasads IMAX",
        "Sathyam Cinemas",
      ].filter((c) => c.toLowerCase().includes(globalSearch.toLowerCase()))
    : [];

  const filteredCities = (cities || []).filter(
    (c) =>
      c.name.toLowerCase().includes(citySearchQuery.toLowerCase()) ||
      c.state.toLowerCase().includes(citySearchQuery.toLowerCase())
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#09090b]/95 backdrop-blur-md">
        {/* Main Primary Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo */}
            <Link href={`/?city=${encodeURIComponent(selectedCity.slug)}`} className="flex items-center gap-2.5 group shrink-0">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white leading-none">
                  My <span className="text-primary font-bold">Movie</span> Booking
                </span>
                <span className="text-[9px] text-zinc-400 font-semibold tracking-widest uppercase">
                  Cinemas & Tickets
                </span>
              </div>
            </Link>

            {/* Global Search Input */}
            <div ref={searchRef} className="relative flex-1 max-w-xl hidden md:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search for Movies, Cinemas, Genres, or Formats..."
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full h-10 pl-10 pr-10 rounded-full bg-zinc-900 border border-zinc-700/80 text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                {globalSearch && (
                  <button
                    onClick={() => {
                      setGlobalSearch("");
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {isSearchOpen && globalSearch.trim().length > 0 && (
                <div className="absolute top-12 left-0 w-full rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl p-3 z-50 divide-y divide-zinc-800/60 max-h-96 overflow-y-auto">
                  {filteredMovies.length > 0 && (
                    <div className="pb-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-2 py-1">
                        Movies
                      </div>
                      {filteredMovies.map((m) => (
                        <Link
                          key={m.id}
                          href={`/movie/${m.id}?city=${selectedCity.slug}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/80 transition-colors group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.poster_url}
                            alt={m.title}
                            className="w-8 h-11 rounded object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white group-hover:text-primary transition-colors truncate">
                              {m.title}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {m.languages.slice(0, 2).join(", ")} • {m.genre.slice(0, 2).join("/")}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
                            ★ {m.rating}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}

                  {filteredCinemas.length > 0 && (
                    <div className="pt-2">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-2 py-1">
                        Cinemas & Venues
                      </div>
                      {filteredCinemas.map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-800/80 text-sm text-zinc-200 cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 text-primary" />
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredMovies.length === 0 && filteredCinemas.length === 0 && (
                    <div className="py-6 text-center text-sm text-zinc-400">
                      No matching movies or cinemas found for &quot;{globalSearch}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Side: City Selector & User Badge */}
            <div className="flex items-center gap-3 shrink-0">
              {/* City Selector Trigger */}
              <button
                onClick={() => setIsCityModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-sm font-medium text-zinc-200 hover:text-white transition-all group"
              >
                <MapPin className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                <span>{selectedCity.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
              </button>

              {/* Sign In / Profile Badge */}
              <button className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-md shadow-primary/20 transition-all">
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Navigation Sub-bar */}
        <div className="border-t border-zinc-850/80 bg-zinc-950/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-medium text-zinc-400 h-9">
            <div className="flex items-center gap-6 overflow-x-auto py-1 no-scrollbar">
              <Link href={`/?city=${selectedCity.slug}`} className="text-white hover:text-primary transition-colors flex items-center gap-1">
                <Clapperboard className="w-3 h-3 text-primary" />
                Movies
              </Link>
              <span className="hover:text-zinc-200 cursor-pointer transition-colors">Stream</span>
              <span className="hover:text-zinc-200 cursor-pointer transition-colors">Events</span>
              <span className="hover:text-zinc-200 cursor-pointer transition-colors">Plays</span>
              <span className="hover:text-zinc-200 cursor-pointer transition-colors">Sports</span>
              <span className="hover:text-zinc-200 cursor-pointer transition-colors">Activities</span>
            </div>
            <div className="hidden lg:flex items-center gap-4 text-zinc-400">
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <Sparkles className="w-3 h-3" />
                Offers
              </span>
              <span className="text-[11px] hover:text-zinc-300 cursor-pointer">Gift Cards</span>
            </div>
          </div>
        </div>
      </header>

      {/* City Selector Modal */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-white">Select Your City</h3>
              </div>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* City Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search for your city..."
                value={citySearchQuery}
                onChange={(e) => setCitySearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Popular Cities Grid */}
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Popular Cities
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {filteredCities.map((city) => {
                  const isSelected = city.slug === selectedCity.slug;
                  return (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-white font-semibold shadow-md shadow-primary/10"
                          : "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-zinc-700 text-zinc-300"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center mb-1.5 text-base">
                        🏙️
                      </div>
                      <span className="text-xs font-medium leading-tight">{city.name}</span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">{city.state}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-center pt-2 text-xs text-zinc-500">
              Can’t find your city? Check back soon as we expand to more regions!
            </div>
          </div>
        </div>
      )}
    </>
  );
}
