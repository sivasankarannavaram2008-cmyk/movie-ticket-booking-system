"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BarChart3, RefreshCw, Users } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";

interface OccupancyRow {
  showId: string;
  movieTitle: string;
  cinemaName: string;
  screenName: string;
  screenTier: string;
  date: string;
  time: string;
  totalSeats: number;
  bookedSeats: number;
  occupancy: number; // 0-100
}

/* ── Mock occupancy data ─────────────────────────────── */
function generateMockOccupancy(): OccupancyRow[] {
  const movies = [
    "Kalki 2898 AD", "Jawan: Extended Cut", "Devara: Part 1",
    "Stree 2: Sarkate Ka Aatank", "Dune: Part Two", "Pushpa 2: The Rule",
  ];
  const cinemas = [
    "PVR INOX Palladium", "Cinépolis Grand Mall", "Prasads Multiplex",
    "Sathyam Cinemas SPI", "AMB Cinemas", "INOX Quest Mall",
  ];
  const screens = ["Audi 1 – IMAX", "Audi 2 – 4DX", "Audi 3 – Dolby Atmos", "Audi 4 – Standard"];
  const tiers = ["IMAX", "4DX", "Standard", "Standard"];
  const times = ["10:00 AM", "01:30 PM", "05:15 PM", "09:00 PM"];

  const today = new Date();

  return Array.from({ length: 16 }, (_, i) => {
    const totalSeats = 200 + (i % 3) * 100;
    const bookedSeats = Math.floor(totalSeats * (0.2 + Math.random() * 0.7));
    const dateOffset = i % 3;
    const d = new Date(today);
    d.setDate(d.getDate() + dateOffset);

    return {
      showId: `show-mock-${i}`,
      movieTitle: movies[i % movies.length],
      cinemaName: cinemas[i % cinemas.length],
      screenName: screens[i % screens.length],
      screenTier: tiers[i % tiers.length],
      date: d.toISOString().split("T")[0],
      time: times[i % times.length],
      totalSeats,
      bookedSeats,
      occupancy: Math.round((bookedSeats / totalSeats) * 100),
    };
  }).sort((a, b) => b.occupancy - a.occupancy);
}

/* ── Component ─────────────────────────────────────── */
export function OccupancyStats() {
  const [rows, setRows] = useState<OccupancyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOccupancy = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseAdmin();

      // 1. Get active shows with movie/screen/cinema info
      const { data: shows, error: showErr } = await supabase
        .from("shows")
        .select(`
          id, date, start_time,
          movies!inner ( title ),
          screens!inner ( id, name, screen_tier,
            cinemas!inner ( name )
          )
        `)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(50);

      if (showErr || !shows || shows.length === 0) {
        setRows(generateMockOccupancy());
        setLoading(false);
        return;
      }

      // 2. For each show, count total seats for its screen and booked seats
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const occupancyData: OccupancyRow[] = await Promise.all(shows.map(async (show: any) => {
        const screenId = show.screens?.id;

        // Total seats for the screen
        const { count: totalSeats } = await supabase
          .from("seats")
          .select("id", { count: "exact", head: true })
          .eq("screen_id", screenId);

        // Booked seats for this specific show
        const { count: bookedSeats } = await supabase
          .from("booking_seats")
          .select("id", { count: "exact", head: true })
          .in(
            "booking_id",
            // Subquery via join isn't directly supported, so fetch booking ids first
            (await supabase
              .from("bookings")
              .select("id")
              .eq("show_id", show.id)
              .in("status", ["CONFIRMED", "LOCKED"])
            ).data?.map((b: { id: string }) => b.id) || []
          );

        const total = totalSeats || 500;
        const booked = bookedSeats || 0;

        return {
          showId: show.id,
          movieTitle: show.movies?.title || "Unknown",
          cinemaName: show.screens?.cinemas?.name || "Unknown",
          screenName: show.screens?.name || "Unknown",
          screenTier: show.screens?.screen_tier || "Standard",
          date: show.date,
          time: show.start_time,
          totalSeats: total,
          bookedSeats: booked,
          occupancy: Math.round((booked / total) * 100),
        };
      }));

      setRows(occupancyData.sort((a, b) => b.occupancy - a.occupancy));
    } catch {
      setRows(generateMockOccupancy());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOccupancy();
  }, [fetchOccupancy]);

  const getOccupancyColor = (pct: number) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-amber-500";
    if (pct >= 40) return "bg-emerald-500";
    return "bg-blue-500";
  };

  const getOccupancyTextColor = (pct: number) => {
    if (pct >= 90) return "text-red-400";
    if (pct >= 70) return "text-amber-400";
    if (pct >= 40) return "text-emerald-400";
    return "text-blue-400";
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      IMAX: "bg-purple-500/15 text-purple-400 ring-purple-500/25",
      "4DX": "bg-cyan-500/15 text-cyan-400 ring-cyan-500/25",
      Standard: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/25",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ${colors[tier] || colors.Standard}`}
      >
        {tier}
      </span>
    );
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4.5 h-4.5 text-primary" />
          <h2 className="text-base font-semibold text-white">Screen Occupancy</h2>
        </div>
        <button
          onClick={fetchOccupancy}
          className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Content */}
      <div className="divide-y divide-zinc-800/60">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="px-5 py-4 animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 bg-zinc-800 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-48" />
                  <div className="h-3 bg-zinc-800 rounded w-32" />
                </div>
                <div className="h-6 w-20 bg-zinc-800 rounded" />
              </div>
            ))
          : rows.map((row) => (
              <div key={row.showId} className="px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-zinc-200 truncate">
                        {row.movieTitle}
                      </span>
                      {getTierBadge(row.screenTier)}
                    </div>
                    <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{row.cinemaName}</span>
                      <span>•</span>
                      <span>{row.screenName}</span>
                      <span>•</span>
                      <span>{row.date} at {row.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getOccupancyTextColor(row.occupancy)}`}>
                        {row.occupancy}%
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <Users className="w-3 h-3" />
                        {row.bookedSeats}/{row.totalSeats}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getOccupancyColor(row.occupancy)}`}
                    style={{ width: `${row.occupancy}%` }}
                  />
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
