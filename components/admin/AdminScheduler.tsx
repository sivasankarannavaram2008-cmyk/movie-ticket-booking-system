"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Film,
  Building,
  Monitor,
  RefreshCw,
  Sparkles,
  Layers,
  Trash2,
  AlertTriangle,
  X,
  ShieldAlert,
  Info,
} from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CITIES, MOCK_MOVIES } from "@/lib/mock-data";
import {
  parseTimeToMinutes,
  formatMinutesTo12Hour,
  formatMinutesTo24Hour,
} from "@/lib/shows-store";

interface CityOption {
  id: string;
  name: string;
  slug: string;
}

interface CinemaOption {
  id: string;
  name: string;
  cityId: string;
}

interface ScreenOption {
  id: string;
  name: string;
  cinemaId: string;
  screenTier: "IMAX" | "4DX" | "Standard";
}

interface MovieOption {
  id: string;
  title: string;
  durationMin: number;
  censorRating: string;
  languages: string[];
}

export interface ScheduledShowItem {
  id: string;
  screenId?: string;
  cityName: string;
  cinemaName: string;
  screenName: string;
  screenTier: string;
  movieTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  classicPrice: number;
  primePrice: number;
  reclinerPrice: number;
  createdAt: string;
}

interface ToastNotice {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "warning";
}

// Fallback seed for cinemas/screens if Supabase returns empty
const FALLBACK_CINEMAS: Record<string, { id: string; name: string; screens: { id: string; name: string; tier: "IMAX" | "4DX" | "Standard" }[] }[]> = {
  mumbai: [
    {
      id: "cinema-mum-1",
      name: "PVR INOX Palladium, Lower Parel",
      screens: [
        { id: "screen-mum-1-1", name: "Audi 1 - Laser IMAX", tier: "IMAX" },
        { id: "screen-mum-1-2", name: "Audi 2 - 4DX Dynamic", tier: "4DX" },
        { id: "screen-mum-1-3", name: "Audi 3 - Dolby Atmos Premiere", tier: "Standard" },
      ],
    },
    {
      id: "cinema-mum-2",
      name: "Cinépolis Grand Mall, Andheri",
      screens: [
        { id: "screen-mum-2-1", name: "Screen 1 - VIP IMAX", tier: "IMAX" },
        { id: "screen-mum-2-2", name: "Screen 2 - Macro XE Atmos", tier: "Standard" },
      ],
    },
  ],
  "delhi-ncr": [
    {
      id: "cinema-del-1",
      name: "PVR Director's Cut, Vasant Kunj",
      screens: [
        { id: "screen-del-1-1", name: "Audi 1 - Platinum Club", tier: "Standard" },
        { id: "screen-del-1-2", name: "Audi 2 - 4DX Ultra", tier: "4DX" },
      ],
    },
    {
      id: "cinema-del-2",
      name: "PVR Superplex, Noida Mall of India",
      screens: [
        { id: "screen-del-2-1", name: "Screen 1 - IMAX with Laser", tier: "IMAX" },
        { id: "screen-del-2-2", name: "Screen 2 - Dolby Atmos", tier: "Standard" },
      ],
    },
  ],
  bengaluru: [
    {
      id: "cinema-blr-1",
      name: "PVR Superplex Vega City, Bannerghatta",
      screens: [
        { id: "screen-blr-1-1", name: "Audi 1 - IMAX 3D", tier: "IMAX" },
        { id: "screen-blr-1-2", name: "Audi 2 - 4DX", tier: "4DX" },
      ],
    },
  ],
  hyderabad: [
    {
      id: "cinema-hyd-1",
      name: "Prasads Multiplex, Necklace Road",
      screens: [
        { id: "screen-hyd-1-1", name: "Screen 6 - Large Format IMAX", tier: "IMAX" },
        { id: "screen-hyd-1-2", name: "Screen 4 - Dolby Atmos", tier: "Standard" },
      ],
    },
    {
      id: "cinema-hyd-2",
      name: "AMB Cinemas, Gachibowli",
      screens: [
        { id: "screen-hyd-2-1", name: "Screen 1 - VIP Laser", tier: "Standard" },
      ],
    },
  ],
};

export interface AdminSchedulerProps {
  refreshTrigger?: number;
}

export function AdminScheduler({ refreshTrigger }: AdminSchedulerProps = {}) {
  // Cascading options
  const [cities, setCities] = useState<CityOption[]>([]);
  const [cinemas, setCinemas] = useState<CinemaOption[]>([]);
  const [screens, setScreens] = useState<ScreenOption[]>([]);
  const [movies, setMovies] = useState<MovieOption[]>([]);

  // Selection form state
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>("");
  const [selectedScreenId, setSelectedScreenId] = useState<string>("");
  const [selectedMovieId, setSelectedMovieId] = useState<string>("");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split("T")[0];

  const [showDate, setShowDate] = useState<string>(defaultDateStr);
  const [startTime, setStartTime] = useState<string>("18:30");

  // Tier pricing inputs
  const [classicPrice, setClassicPrice] = useState<number>(250);
  const [primePrice, setPrimePrice] = useState<number>(380);
  const [reclinerPrice, setReclinerPrice] = useState<number>(550);

  // UI status
  const [publishing, setPublishing] = useState<boolean>(false);
  const [deletingShowId, setDeletingShowId] = useState<string | null>(null);
  const [scheduledShows, setScheduledShows] = useState<ScheduledShowItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(true);

  // Floating Toast Notifications
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotice, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Fetch cities and movies on mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        const supabase = getSupabaseAdmin();

        // Load Cities
        const { data: cityData } = await supabase
          .from("cities")
          .select("id, name, slug")
          .order("name", { ascending: true });

        if (cityData && cityData.length > 0) {
          setCities(cityData);
          setSelectedCityId(cityData[0].id);
        } else {
          const fallback = CITIES.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
          setCities(fallback);
          setSelectedCityId(fallback[0].id);
        }

        // Load Movies
        const { data: movieData } = await supabase
          .from("movies")
          .select("id, title, duration_min, censor_rating, languages")
          .order("title", { ascending: true });

        if (movieData && movieData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mappedMovies = movieData.map((m: any) => ({
            id: m.id,
            title: m.title,
            durationMin: m.duration_min,
            censorRating: m.censor_rating,
            languages: m.languages,
          }));
          setMovies(mappedMovies);
          setSelectedMovieId(mappedMovies[0].id);
        } else {
          const fallback = MOCK_MOVIES.map((m) => ({
            id: m.id,
            title: m.title,
            durationMin: m.duration_min,
            censorRating: m.censor_rating,
            languages: m.languages,
          }));
          setMovies(fallback);
          setSelectedMovieId(fallback[0].id);
        }
      } catch (err) {
        console.error("Failed to load scheduler metadata:", err);
        const fallbackCities = CITIES.map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
        setCities(fallbackCities);
        setSelectedCityId(fallbackCities[0].id);

        const fallbackMovies = MOCK_MOVIES.map((m) => ({
          id: m.id,
          title: m.title,
          durationMin: m.duration_min,
          censorRating: m.censor_rating,
          languages: m.languages,
        }));
        setMovies(fallbackMovies);
        setSelectedMovieId(fallbackMovies[0].id);
      }
    }

    loadMetadata();
  }, []);

  // 2. Load cinemas when selectedCityId changes
  useEffect(() => {
    if (!selectedCityId) return;

    async function loadCinemas() {
      try {
        const supabase = getSupabaseAdmin();
        const { data: cinemaData } = await supabase
          .from("cinemas")
          .select("id, name, city_id")
          .eq("city_id", selectedCityId)
          .order("name", { ascending: true });

        if (cinemaData && cinemaData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped = cinemaData.map((c: any) => ({ id: c.id, name: c.name, cityId: c.city_id }));
          setCinemas(mapped);
          setSelectedCinemaId(mapped[0].id);
        } else {
          const activeCity = cities.find((c) => c.id === selectedCityId);
          const slug = activeCity?.slug || "mumbai";
          const fallbackList = FALLBACK_CINEMAS[slug] || FALLBACK_CINEMAS["mumbai"];
          const mapped = fallbackList.map((c) => ({ id: c.id, name: c.name, cityId: selectedCityId }));
          setCinemas(mapped);
          setSelectedCinemaId(mapped[0].id);
        }
      } catch {
        const activeCity = cities.find((c) => c.id === selectedCityId);
        const slug = activeCity?.slug || "mumbai";
        const fallbackList = FALLBACK_CINEMAS[slug] || FALLBACK_CINEMAS["mumbai"];
        const mapped = fallbackList.map((c) => ({ id: c.id, name: c.name, cityId: selectedCityId }));
        setCinemas(mapped);
        setSelectedCinemaId(mapped[0].id);
      }
    }

    loadCinemas();
  }, [selectedCityId, cities]);

  // 3. Load screens when selectedCinemaId changes
  useEffect(() => {
    if (!selectedCinemaId) return;

    async function loadScreens() {
      try {
        const supabase = getSupabaseAdmin();
        const { data: screenData } = await supabase
          .from("screens")
          .select("id, name, cinema_id, screen_tier")
          .eq("cinema_id", selectedCinemaId)
          .order("name", { ascending: true });

        if (screenData && screenData.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: ScreenOption[] = screenData.map((s: any) => ({
            id: s.id,
            name: s.name,
            cinemaId: s.cinema_id,
            screenTier: s.screen_tier,
          }));
          setScreens(mapped);
          setSelectedScreenId(mapped[0].id);
        } else {
          let foundScreens: ScreenOption[] = [];
          Object.values(FALLBACK_CINEMAS).forEach((cList) => {
            const cinema = cList.find((c) => c.id === selectedCinemaId);
            if (cinema) {
              foundScreens = cinema.screens.map((sc) => ({
                id: sc.id,
                name: sc.name,
                cinemaId: selectedCinemaId,
                screenTier: sc.tier,
              }));
            }
          });

          if (foundScreens.length === 0) {
            foundScreens = [
              { id: `screen-${selectedCinemaId}-1`, name: "Audi 1 - Laser IMAX", cinemaId: selectedCinemaId, screenTier: "IMAX" },
              { id: `screen-${selectedCinemaId}-2`, name: "Audi 2 - Dolby Atmos", cinemaId: selectedCinemaId, screenTier: "Standard" },
            ];
          }

          setScreens(foundScreens);
          setSelectedScreenId(foundScreens[0].id);
        }
      } catch {
        const fallback = [
          { id: `screen-${selectedCinemaId}-1`, name: "Audi 1 - Laser IMAX", cinemaId: selectedCinemaId, screenTier: "IMAX" as const },
          { id: `screen-${selectedCinemaId}-2`, name: "Audi 2 - Dolby Atmos", cinemaId: selectedCinemaId, screenTier: "Standard" as const },
        ];
        setScreens(fallback);
        setSelectedScreenId(fallback[0].id);
      }
    }

    loadScreens();
  }, [selectedCinemaId]);

  // 4. Fetch scheduled shows
  const fetchRecentShows = useCallback(async () => {
    setLoadingSchedule(true);
    try {
      const res = await fetch("/api/shows");
      if (res.ok) {
        const data = await res.json();
        if (data.shows && Array.isArray(data.shows) && data.shows.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: ScheduledShowItem[] = data.shows.map((d: any) => ({
            id: d.id,
            screenId: d.screenId,
            cityName: d.cityName || "Metropolis",
            cinemaName: d.cinemaName || "Cinema Center",
            screenName: d.screenName || "Audi 1",
            screenTier: d.screenTier || "Standard",
            movieTitle: d.movieTitle || "Feature Presentation",
            date: d.date,
            startTime: d.startTime,
            endTime: d.endTime || "21:00",
            classicPrice: d.classicPrice || 220,
            primePrice: d.primePrice || 350,
            reclinerPrice: d.reclinerPrice || 580,
            createdAt: d.createdAt || new Date().toISOString(),
          }));

          setScheduledShows(mapped);
          setLoadingSchedule(false);
          return;
        }
      }

      setScheduledShows([]);
    } catch {
      setScheduledShows([]);
    }
    setLoadingSchedule(false);
  }, []);

  useEffect(() => {
    fetchRecentShows();
  }, [fetchRecentShows, refreshTrigger]);

  // ── Calculation 1: Automatic Show Runtime & Slot End-Time Calculation ──
  const selectedMovie = useMemo(() => {
    return movies.find((m) => m.id === selectedMovieId) || movies[0];
  }, [movies, selectedMovieId]);

  const durationMin = selectedMovie?.durationMin || 150;
  const TURNOVER_BUFFER = 20; // 20 minutes intermission & cleaning turnaround

  const startMinutes = useMemo(() => parseTimeToMinutes(startTime), [startTime]);
  const endMinutes = useMemo(() => startMinutes + durationMin + TURNOVER_BUFFER, [startMinutes, durationMin]);

  const startTime12 = useMemo(() => formatMinutesTo12Hour(startMinutes), [startMinutes]);
  const endTime12 = useMemo(() => formatMinutesTo12Hour(endMinutes), [endMinutes]);
  const endTime24 = useMemo(() => formatMinutesTo24Hour(endMinutes), [endMinutes]);

  // ── Calculation 2: Screen Shows for Selected Date & Screen ──
  const activeScreen = useMemo(() => {
    return screens.find((s) => s.id === selectedScreenId);
  }, [screens, selectedScreenId]);

  const screenShowsForDate = useMemo(() => {
    if (!selectedScreenId) return [];
    return scheduledShows.filter((s) => {
      if (s.date !== showDate) return false;
      if (s.screenId && s.screenId === selectedScreenId) return true;
      if (activeScreen?.name && s.screenName.toLowerCase().includes(activeScreen.name.toLowerCase())) return true;
      return false;
    });
  }, [scheduledShows, selectedScreenId, activeScreen, showDate]);

  // ── Calculation 3: Conflict Detection ──
  // Check if proposed slot overlaps with any existing show on the same screen:
  // Overlap condition: (existingStart < newEnd) AND (existingEnd > newStart)
  const conflictShow = useMemo(() => {
    for (const s of screenShowsForDate) {
      const exStart = parseTimeToMinutes(s.startTime);
      let exEnd = parseTimeToMinutes(s.endTime);
      if (exEnd <= exStart) exEnd += 24 * 60; // Overnight show

      let checkEnd = endMinutes;
      if (checkEnd <= startMinutes) checkEnd += 24 * 60;

      if (exStart < checkEnd && exEnd > startMinutes) {
        return s;
      }
    }
    return null;
  }, [screenShowsForDate, startMinutes, endMinutes]);

  // 5. "Publish Showtime" mutation with conflict prevention
  const handlePublishShowtime = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedScreenId || !selectedMovieId || !showDate || !startTime) {
      addToast({
        type: "error",
        title: "Incomplete details",
        description: "Please select Screen, Movie, Date, and Start Time.",
      });
      return;
    }

    if (conflictShow) {
      addToast({
        type: "error",
        title: "Schedule collision detected",
        description: `Conflict: ${conflictShow.movieTitle} is already scheduled on this screen (${conflictShow.startTime} – ${conflictShow.endTime}).`,
      });
      return;
    }

    setPublishing(true);

    const activeCity = cities.find((c) => c.id === selectedCityId);
    const activeCinema = cinemas.find((c) => c.id === selectedCinemaId);

    try {
      const res = await fetch("/api/shows/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenId: selectedScreenId,
          screenName: activeScreen?.name || "Audi 1",
          screenTier: activeScreen?.screenTier || "Standard",
          cinemaId: selectedCinemaId,
          cinemaName: activeCinema?.name || "Multiplex Cinema",
          cinemaAddress: "High Street Cineplex Hub",
          citySlug: activeCity?.slug || "mumbai",
          cityName: activeCity?.name || "Mumbai",
          movieId: selectedMovieId,
          movieTitle: selectedMovie?.title || "Movie",
          date: showDate,
          startTime: startTime,
          tierPricing: {
            classic: classicPrice,
            prime: primePrice,
            recliner: reclinerPrice,
          },
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Conflict rejected by backend
        addToast({
          type: "error",
          title: "Schedule collision detected",
          description: data.error || "Conflict detected with an existing screening on this screen.",
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to publish showtime");
      }

      // Success
      addToast({
        type: "success",
        title: "Showtime published successfully",
        description: `"${selectedMovie?.title}" scheduled at ${activeCinema?.name} on ${showDate} (${startTime12} – ${endTime12}).`,
      });

      // Refresh scheduled shows list
      fetchRecentShows();
    } catch (err: unknown) {
      console.error("Publishing error:", err);
      addToast({
        type: "error",
        title: "Publishing failed",
        description: err instanceof Error ? err.message : "Failed to publish showtime.",
      });
    } finally {
      setPublishing(false);
    }
  };

  // 6. "Unschedule / Delete Show" mutation with booking safety guard
  const handleUnscheduleShow = async (showId: string, movieTitle: string) => {
    if (!window.confirm(`Are you sure you want to unschedule "${movieTitle}"? This will remove it from the booking matrix.`)) {
      return;
    }

    setDeletingShowId(showId);

    try {
      const res = await fetch(`/api/shows/schedule?showId=${encodeURIComponent(showId)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.status === 409) {
        // Bookings guard triggered
        addToast({
          type: "warning",
          title: "Cannot unschedule: Active bookings exist.",
          description: data.details || "This showtime already has reserved or purchased tickets and cannot be removed.",
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to unschedule showtime");
      }

      addToast({
        type: "success",
        title: "Showtime unscheduled successfully",
        description: `"${movieTitle}" was removed from the active schedule.`,
      });

      // Update state immediately
      setScheduledShows((prev) => prev.filter((s) => s.id !== showId));
    } catch (err: unknown) {
      console.error("Unschedule error:", err);
      addToast({
        type: "error",
        title: "Unschedule failed",
        description: err instanceof Error ? err.message : "An error occurred while removing the show.",
      });
    } finally {
      setDeletingShowId(null);
    }
  };

  // Timeline markers (08:00 AM to 02:00 AM = 1080 total minutes)
  const TIMELINE_START = 8 * 60; // 08:00 AM = 480 mins
  const TIMELINE_DURATION = 18 * 60; // 18 hours = 1080 mins

  const timelineTicks = [
    { label: "08:00 AM", mins: 8 * 60 },
    { label: "11:00 AM", mins: 11 * 60 },
    { label: "02:00 PM", mins: 14 * 60 },
    { label: "05:00 PM", mins: 17 * 60 },
    { label: "08:00 PM", mins: 20 * 60 },
    { label: "11:00 PM", mins: 23 * 60 },
    { label: "02:00 AM", mins: 26 * 60 },
  ];

  return (
    <div className="space-y-8 relative">
      {/* ── Floating Toast Notifications System ── */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in ${
              toast.type === "success"
                ? "bg-zinc-950/95 border-emerald-500/50 text-emerald-300 shadow-emerald-950/40"
                : toast.type === "warning"
                ? "bg-zinc-950/95 border-amber-500/50 text-amber-300 shadow-amber-950/40"
                : "bg-zinc-950/95 border-rose-500/50 text-rose-300 shadow-rose-950/40"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : toast.type === "warning" ? (
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 text-xs">
              <h4 className="font-bold text-sm tracking-wide text-white mb-0.5">{toast.title}</h4>
              {toast.description && <p className="opacity-90 leading-relaxed">{toast.description}</p>}
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-zinc-400 hover:text-white p-1 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Main 2-Column Grid: Form (Left) & Recent Schedule (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* FORM PANEL (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                Schedule New Showtime
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Dynamic runtime turnover calculation & real-time collision detection
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Conflict Guard
            </span>
          </div>

          <form onSubmit={handlePublishShowtime} className="space-y-5">
            {/* Row 1: City & Cinema */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-zinc-400" />
                  1. Target City
                </label>
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-zinc-400" />
                  2. Multiplex Cinema
                </label>
                <select
                  value={selectedCinemaId}
                  onChange={(e) => setSelectedCinemaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                >
                  {cinemas.map((cinema) => (
                    <option key={cinema.id} value={cinema.id}>
                      {cinema.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Screen & Movie */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-zinc-400" />
                  3. Screen & Format
                </label>
                <select
                  value={selectedScreenId}
                  onChange={(e) => setSelectedScreenId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                >
                  {screens.map((screen) => (
                    <option key={screen.id} value={screen.id}>
                      {screen.name} ({screen.screenTier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-primary" />
                  4. Movie Title
                </label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                >
                  {movies.map((movie) => (
                    <option key={movie.id} value={movie.id}>
                      {movie.title} ({movie.censorRating} • {movie.durationMin}m)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Date & Start Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  Show Date
                </label>
                <input
                  type="date"
                  value={showDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setShowDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  Start Time (24h)
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
                  required
                />
              </div>
            </div>

            {/* ── Feature 1: Automatic Show Runtime & Slot End-Time Preview ── */}
            <div className="p-4 rounded-xl border bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-zinc-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  Dynamic Slot Calculation
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {startTime12} ➔ {endTime12}
                </span>
              </div>

              <p className="text-sm font-semibold text-zinc-100">
                Scheduled Slot: <span className="text-primary font-bold">{startTime12} – {endTime12}</span>
                <span className="text-xs font-normal text-zinc-400 ml-1.5">
                  (Includes {TURNOVER_BUFFER}m turnover buffer)
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/70">
                  🎞️ Runtime: {durationMin} mins
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  🧹 Buffer: +{TURNOVER_BUFFER} mins cleaning & intermission
                </span>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  ⏳ Total Reserved: {durationMin + TURNOVER_BUFFER} mins
                </span>
              </div>
            </div>

            {/* ── Feature 2: Interactive Timeline Grid & Conflict Visualizer ── */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Day Schedule Timeline: {activeScreen?.name || "Selected Screen"}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400">
                  {screenShowsForDate.length} slot(s) scheduled for {showDate}
                </span>
              </div>

              {/* Timeline Container */}
              <div className="space-y-1.5 pt-2">
                <div className="relative h-12 w-full bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center">
                  {/* Grid hour vertical markers */}
                  {timelineTicks.map((tick) => {
                    const leftPct = ((tick.mins - TIMELINE_START) / TIMELINE_DURATION) * 100;
                    if (leftPct < 0 || leftPct > 100) return null;
                    return (
                      <div
                        key={tick.label}
                        style={{ left: `${leftPct}%` }}
                        className="absolute top-0 bottom-0 w-px bg-zinc-800/80 pointer-events-none"
                      />
                    );
                  })}

                  {/* Scheduled Existing Shows */}
                  {screenShowsForDate.map((show) => {
                    const startM = parseTimeToMinutes(show.startTime);
                    let endM = parseTimeToMinutes(show.endTime);
                    if (endM <= startM) endM += 24 * 60;

                    const leftPct = Math.max(0, ((startM - TIMELINE_START) / TIMELINE_DURATION) * 100);
                    const widthPct = Math.max(3, ((endM - startM) / TIMELINE_DURATION) * 100);

                    return (
                      <div
                        key={show.id}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${show.movieTitle} (${show.startTime} – ${show.endTime})`}
                        className="absolute h-8 top-2 rounded bg-indigo-900/60 border border-indigo-500/50 text-[10px] text-indigo-200 px-1.5 flex items-center overflow-hidden whitespace-nowrap text-ellipsis shadow-sm"
                      >
                        <span className="font-semibold truncate">{show.movieTitle}</span>
                      </div>
                    );
                  })}

                  {/* Proposed New Show Slot */}
                  {(() => {
                    let endM = endMinutes;
                    if (endM <= startMinutes) endM += 24 * 60;

                    const leftPct = Math.max(0, ((startMinutes - TIMELINE_START) / TIMELINE_DURATION) * 100);
                    const widthPct = Math.max(3, ((endM - startMinutes) / TIMELINE_DURATION) * 100);

                    return (
                      <div
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`PROPOSED: ${selectedMovie?.title} (${startTime12} – ${endTime12})`}
                        className={`absolute h-9 top-1.5 rounded border text-[10px] px-1.5 flex items-center overflow-hidden whitespace-nowrap text-ellipsis z-10 transition-all ${
                          conflictShow
                            ? "bg-rose-600/80 border-rose-400 text-white font-bold animate-pulse shadow-md shadow-rose-600/40"
                            : "bg-emerald-600/80 border-emerald-400 text-white font-semibold shadow-md shadow-emerald-600/40"
                        }`}
                      >
                        <span className="truncate">
                          {conflictShow ? "⚠️ CONFLICT!" : "★ PROPOSED"} ({startTime12})
                        </span>
                      </div>
                    );
                  })()}
                </div>

                {/* Timeline axis tick labels */}
                <div className="relative h-4 w-full text-[9px] text-zinc-500 font-mono select-none">
                  {timelineTicks.map((tick) => {
                    const leftPct = ((tick.mins - TIMELINE_START) / TIMELINE_DURATION) * 100;
                    if (leftPct < 0 || leftPct > 100) return null;
                    return (
                      <span
                        key={tick.label}
                        style={{ left: `${leftPct}%` }}
                        className="absolute -translate-x-1/2 whitespace-nowrap"
                      >
                        {tick.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Conflict Status Alert Banner */}
              {conflictShow ? (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div>
                    <strong className="font-bold text-rose-200">Schedule Collision Detected:</strong>
                    <p className="mt-0.5 text-rose-300">
                      Proposed slot overlaps with <strong className="text-white">{conflictShow.movieTitle}</strong> ({conflictShow.startTime} – {conflictShow.endTime}) on this screen.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Auditorium screen is clear. No schedule conflict for <strong>{startTime12} – {endTime12}</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* Row 4: Seat Tier Pricing Matrix */}
            <div className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Tier Pricing Configuration (INR)
                </span>
                <span className="text-[11px] text-zinc-500">Per ticket base rate</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Classic */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Classic (Front)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">₹</span>
                    <input
                      type="number"
                      min={50}
                      step={10}
                      value={classicPrice}
                      onChange={(e) => setClassicPrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Prime */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Prime (Center)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">₹</span>
                    <input
                      type="number"
                      min={100}
                      step={10}
                      value={primePrice}
                      onChange={(e) => setPrimePrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Recliner */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Recliner (VIP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">₹</span>
                    <input
                      type="number"
                      min={150}
                      step={10}
                      value={reclinerPrice}
                      onChange={(e) => setReclinerPrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={publishing || Boolean(conflictShow)}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm transition shadow-lg ${
                  conflictShow
                    ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed shadow-none"
                    : "bg-primary hover:bg-primary/90 active:scale-[0.99] text-white shadow-primary/25 disabled:opacity-50"
                }`}
              >
                {publishing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Validating & Publishing Showtime...
                  </>
                ) : conflictShow ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Cannot Schedule: Conflict Detected
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Publish Showtime & Activate Matrix
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── RECENTLY SCHEDULED SHOWS PANEL (5 cols) ── */}
        <div className="lg:col-span-5 bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Active & Scheduled Shows
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">Most recent published screenings</p>
            </div>
            <button
              onClick={fetchRecentShows}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition"
              title="Refresh scheduled list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSchedule ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-[640px] pr-1">
            {loadingSchedule ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/50 animate-pulse space-y-2">
                  <div className="h-4 w-40 bg-zinc-800 rounded" />
                  <div className="h-3 w-48 bg-zinc-800/60 rounded" />
                  <div className="h-3 w-32 bg-zinc-800/40 rounded" />
                </div>
              ))
            ) : scheduledShows.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <Film className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                <p className="text-sm">No scheduled shows found.</p>
              </div>
            ) : (
              scheduledShows.map((show) => (
                <div
                  key={show.id}
                  className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 transition space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-sm text-zinc-100 block">
                        {show.movieTitle}
                      </span>
                      <span className="text-xs text-zinc-400 block mt-0.5">
                        {show.cinemaName} • <span className="text-zinc-300">{show.screenName}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Live
                      </span>
                      {/* Delete / Unschedule CTA */}
                      <button
                        type="button"
                        onClick={() => handleUnscheduleShow(show.id, show.movieTitle)}
                        disabled={deletingShowId === show.id}
                        title="Unschedule showtime (Allowed if 0 bookings)"
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        {deletingShowId === show.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-zinc-400 pt-1 border-t border-zinc-850">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Calendar className="w-3 h-3 text-zinc-500" />
                        {show.date}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-300">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {show.startTime} - {show.endTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300">
                      <span className="text-zinc-500">₹{show.classicPrice}</span>
                      <span className="text-zinc-600">/</span>
                      <span className="text-zinc-400">₹{show.primePrice}</span>
                      <span className="text-zinc-600">/</span>
                      <span className="text-emerald-400 font-semibold">₹{show.reclinerPrice}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminScheduler;
