"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Activity,
  Users,
  Search,
  RefreshCw,
  Film,
  Monitor,
  Building,
  Clock,
  Flame,
  CheckCircle,
  Radio,
  Lock,
  Unlock,
  AlertTriangle,
  Armchair,
  Wrench,
  ShieldAlert,
  IndianRupee,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { TelemetrySeatDetail } from "@/app/api/admin/telemetry/route";

interface ScreeningOption {
  showId: string;
  movieId: string;
  movieTitle: string;
  cinemaId: string;
  cinemaName: string;
  cityName: string;
  screenId: string;
  screenName: string;
  screenTier: string;
  date: string;
  startTime: string;
  endTime: string;
  classicPrice: number;
  primePrice: number;
  reclinerPrice: number;
}

interface TelemetryStats {
  totalSeats: number;
  availableSeats: number;
  lockedSeats: number;
  bookedSeats: number;
  blockedSeats: number;
  occupancyRate: number;
  revenueCollected: number;
}

interface AdminTelemetryProps {
  refreshTrigger?: number;
}

export function AdminTelemetry({ refreshTrigger }: AdminTelemetryProps = {}) {
  // Screening selectors state
  const [screeningsList, setScreeningsList] = useState<ScreeningOption[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>("");
  const [selectedShowId, setSelectedShowId] = useState<string>("");

  // Live Telemetry data for selected show
  const [seatMatrix, setSeatMatrix] = useState<TelemetrySeatDetail[]>([]);
  const [stats, setStats] = useState<TelemetryStats>({
    totalSeats: 180,
    availableSeats: 180,
    lockedSeats: 0,
    bookedSeats: 0,
    blockedSeats: 0,
    occupancyRate: 0,
    revenueCollected: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Selected seat for inspect popover / details
  const [inspectedSeat, setInspectedSeat] = useState<TelemetrySeatDetail | null>(null);

  // Action feedback status
  const [actionNotice, setActionNotice] = useState<{ text: string; type: "success" | "warning" | "error" } | null>(null);

  const showNotice = (text: string, type: "success" | "warning" | "error" = "success") => {
    setActionNotice({ text, type });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // 1. Load initial available screening options
  useEffect(() => {
    async function loadScreeningOptions() {
      try {
        const res = await fetch("/api/admin/telemetry");
        if (res.ok) {
          const data = await res.json();
          if (data.screenings && Array.isArray(data.screenings) && data.screenings.length > 0) {
            setScreeningsList(data.screenings);

            // Default to first date and cinema
            const first = data.screenings[0];
            setSelectedDate(first.date);
            setSelectedCinemaId(first.cinemaId);
            setSelectedShowId(first.showId);
          }
        }
      } catch (err) {
        console.warn("Failed to load telemetry screening options:", err);
      }
    }

    loadScreeningOptions();
  }, []);

  // Filtered lists for cascading dropdowns
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    screeningsList.forEach((s) => set.add(s.date));
    return Array.from(set).sort();
  }, [screeningsList]);

  const availableCinemas = useMemo(() => {
    const map = new Map<string, string>();
    screeningsList
      .filter((s) => s.date === selectedDate)
      .forEach((s) => map.set(s.cinemaId, `${s.cinemaName} (${s.cityName})`));
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [screeningsList, selectedDate]);

  const availableShows = useMemo(() => {
    return screeningsList.filter(
      (s) => s.date === selectedDate && s.cinemaId === selectedCinemaId
    );
  }, [screeningsList, selectedDate, selectedCinemaId]);

  // Adjust selectedShowId if availableShows changes
  useEffect(() => {
    if (availableShows.length > 0) {
      if (!availableShows.some((s) => s.showId === selectedShowId)) {
        setSelectedShowId(availableShows[0].showId);
      }
    }
  }, [availableShows, selectedShowId]);

  // 2. Fetch live telemetry for selectedShowId
  const fetchLiveTelemetry = useCallback(
    async (silent: boolean = false) => {
      if (!selectedShowId) return;
      if (!silent) setSyncing(true);

      try {
        const res = await fetch(`/api/admin/telemetry?showId=${encodeURIComponent(selectedShowId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.seatMatrix) {
            setSeatMatrix(data.seatMatrix);
          }
          if (data.stats) {
            setStats(data.stats);
          }

          // If inspectedSeat is open, update its live state
          if (inspectedSeat && data.seatMatrix) {
            const updated = data.seatMatrix.find((s: TelemetrySeatDetail) => s.seatId === inspectedSeat.seatId);
            if (updated) setInspectedSeat(updated);
          }
        }
      } catch (err) {
        console.warn("Error fetching live telemetry:", err);
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    },
    [selectedShowId, inspectedSeat]
  );

  useEffect(() => {
    setLoading(true);
    fetchLiveTelemetry(false);
  }, [selectedShowId, refreshTrigger]);

  // 4. Admin Seat Override: Toggle Block/Unblock for Maintenance
  const handleToggleBlockSeat = async (seat: TelemetrySeatDetail) => {
    if (seat.status === "BOOKED") {
      showNotice(`Seat ${seat.label} is already booked and cannot be blocked.`, "warning");
      return;
    }

    const nextAction = seat.status === "BLOCKED" ? "UNBLOCK" : "BLOCK";

    try {
      const res = await fetch("/api/seats/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId: selectedShowId,
          seatId: seat.seatId,
          action: nextAction,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update seat status");
      }

      showNotice(data.message, "success");
      // Refresh telemetry immediately
      fetchLiveTelemetry(true);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Override action failed", "error");
    }
  };

  // 5. Admin Lingering Lock Override: Force Release Redis Lock
  const handleForceReleaseLock = async (seatId: string) => {
    try {
      const res = await fetch("/api/seats/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId: selectedShowId,
          seatIds: [seatId],
          userId: "admin",
          force: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to release lock");
      }

      showNotice(`Lock for seat ${seatId} was forcefully released. Seat is now available.`, "success");
      fetchLiveTelemetry(true);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Failed to force release lock", "error");
    }
  };

  // 6. Force Release ALL Lingering Locks for this Show
  const handleReleaseAllLocks = async () => {
    const lockedSeatIds = seatMatrix.filter((s) => s.status === "LOCKED").map((s) => s.seatId);
    if (lockedSeatIds.length === 0) {
      showNotice("No lingering Redis locks active for this screening.", "warning");
      return;
    }

    if (!window.confirm(`Force release all ${lockedSeatIds.length} lingering lock(s) for this show?`)) {
      return;
    }

    try {
      const res = await fetch("/api/seats/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId: selectedShowId,
          seatIds: lockedSeatIds,
          userId: "admin",
          force: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to release locks");
      }

      showNotice(`Successfully cleared ${lockedSeatIds.length} lingering locks.`, "success");
      fetchLiveTelemetry(true);
    } catch (err: unknown) {
      showNotice(err instanceof Error ? err.message : "Failed to clear locks", "error");
    }
  };

  // Current selected screening object
  const currentScreening = useMemo(() => {
    return screeningsList.find((s) => s.showId === selectedShowId);
  }, [screeningsList, selectedShowId]);

  // Display tiers in order: Recliner (top/back), Prime (middle), Classic (front/closest to screen)
  const tiersOrder: Array<"RECLINER" | "PRIME" | "CLASSIC"> = ["RECLINER", "PRIME", "CLASSIC"];

  const tierMeta = {
    RECLINER: { label: "RECLINER", subtitle: "Luxury VIP Reclining Tier" },
    PRIME: { label: "PRIME", subtitle: "Premium Central Viewing Tier" },
    CLASSIC: { label: "CLASSIC", subtitle: "Standard Cinema View Tier" },
  };

  return (
    <div className="space-y-6 select-none">
      {/* ── Status Feedback Banner ── */}
      {actionNotice && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold shadow-lg transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            actionNotice.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
              : actionNotice.type === "warning"
              ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
              : "bg-rose-500/10 border-rose-500/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : actionNotice.type === "warning" ? (
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Top Bar: Screening Filters & Auto-Refresh Controls ── */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Live Screen Telemetry & Auditorium Inspection
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Inspect real-time seat locks, booking metadata, and execute maintenance blocks
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            {/* On-Demand Telemetry Status Indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>On-Demand Mode</span>
            </div>

            {/* Manual Sync Now Button */}
            <button
              type="button"
              onClick={() => fetchLiveTelemetry(false)}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition disabled:opacity-50 active:scale-95"
              title="Manually fetch latest seat states from Supabase and Redis"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin text-primary" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync Telemetry"}</span>
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Filter 1: Date */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" />
              1. Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 2: Multiplex */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Building className="w-3 h-3 text-zinc-500" />
              2. Multiplex Complex
            </label>
            <select
              value={selectedCinemaId}
              onChange={(e) => setSelectedCinemaId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {availableCinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: Scheduled Showtime */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Film className="w-3 h-3 text-primary" />
              3. Scheduled Showtime
            </label>
            <select
              value={selectedShowId}
              onChange={(e) => setSelectedShowId(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
            >
              {availableShows.map((s) => (
                <option key={s.showId} value={s.showId}>
                  {s.startTime} — {s.movieTitle} ({s.screenName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Feature 1: Performance Overview & Seat Status Breakdown Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3.5">
        {/* Occupancy Card */}
        <div className="col-span-2 p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Show Occupancy</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                {currentScreening?.screenTier || "IMAX"}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-2xl font-black text-white">{stats.occupancyRate}%</span>
              <span className="text-xs text-zinc-400">
                ({stats.bookedSeats + stats.lockedSeats} / {stats.totalSeats} seats active)
              </span>
            </div>
          </div>

          {/* Occupancy Bar */}
          <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-zinc-800/80 mt-3">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.occupancyRate > 80
                  ? "bg-rose-500 shadow-rose-500/50 shadow-sm"
                  : stats.occupancyRate >= 50
                  ? "bg-amber-500 shadow-amber-500/50 shadow-sm"
                  : "bg-emerald-500 shadow-emerald-500/50 shadow-sm"
              }`}
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Revenue Collected Card */}
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Revenue</span>
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-emerald-400">
              ₹{stats.revenueCollected.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">from confirmed bookings</div>
          </div>
        </div>

        {/* Available Seats Card */}
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Available</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-emerald-400">{stats.availableSeats}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              {Math.round((stats.availableSeats / stats.totalSeats) * 100)}% vacant
            </div>
          </div>
        </div>

        {/* Active Redis Locks Card */}
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">In Checkout</span>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-amber-300">{stats.lockedSeats}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">5m Redis TTL locks</div>
          </div>
        </div>

        {/* Blocked / Maintenance Card */}
        <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Maintenance</span>
            <Lock className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-zinc-300">{stats.blockedSeats}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">admin blocked</div>
          </div>
        </div>
      </div>

      {/* ── Main Work Area: 15x12 Heatmap (Left/Center) & Seat Detail Inspector (Right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* HEATMAP AREA (9 cols) */}
        <div className="xl:col-span-8 bg-zinc-900/70 border border-zinc-800 rounded-xl p-6 shadow-2xl flex flex-col items-center space-y-6">
          {/* Heatmap Legend & Maintenance Actions */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-zinc-900 border border-zinc-700 text-[10px] text-zinc-400 flex items-center justify-center font-bold">
                  1
                </div>
                <span className="text-zinc-300 font-medium">Available</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-rose-600 border border-rose-500 text-[10px] text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <span className="text-rose-400 font-medium">Booked (Confirmed)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-amber-500/25 border border-amber-500 text-[10px] text-amber-300 flex items-center justify-center font-bold animate-pulse">
                  ⏳
                </div>
                <span className="text-amber-300 font-medium">In Checkout (Redis)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-zinc-800 border border-zinc-600 text-[10px] text-zinc-400 flex items-center justify-center font-bold">
                  🔒
                </div>
                <span className="text-zinc-400 font-medium">Blocked (Maintenance)</span>
              </div>
            </div>

            {/* Quick Bulk Maintenance Action */}
            {stats.lockedSeats > 0 && (
              <button
                type="button"
                onClick={handleReleaseAllLocks}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                Flush All Lingering Locks ({stats.lockedSeats})
              </button>
            )}
          </div>

          {/* 15x12 Matrix Grid Container */}
          <div className="w-full overflow-x-auto pb-4 no-scrollbar">
            <div className="min-w-[620px] max-w-3xl mx-auto space-y-6">
              {loading ? (
                <div className="py-24 text-center text-zinc-500 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm font-medium">Loading Real-Time Seat Matrix Telemetry...</p>
                </div>
              ) : (
                tiersOrder.map((tierKey) => {
                  const tierSeats = seatMatrix.filter((s) => s.tier === tierKey);
                  if (tierSeats.length === 0) return null;

                  // Group by row label
                  const rowMap = new Map<string, TelemetrySeatDetail[]>();
                  for (const s of tierSeats) {
                    if (!rowMap.has(s.rowLabel)) rowMap.set(s.rowLabel, []);
                    rowMap.get(s.rowLabel)!.push(s);
                  }

                  // Sort rows descending (e.g. O down to M, L down to F, E down to A)
                  const sortedRowLabels = Array.from(rowMap.keys()).sort((a, b) => b.localeCompare(a));
                  const samplePrice = tierSeats[0]?.price || 0;

                  return (
                    <div key={tierKey} className="space-y-2.5">
                      {/* Tier Header */}
                      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-200 tracking-wider">
                            {tierMeta[tierKey].label}
                          </span>
                          <span className="text-zinc-500 text-[11px] hidden sm:inline">
                            • {tierMeta[tierKey].subtitle}
                          </span>
                        </div>
                        <span className="font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 text-[11px]">
                          ₹{samplePrice}
                        </span>
                      </div>

                      {/* Rows Grid */}
                      <div className="space-y-2">
                        {sortedRowLabels.map((rowLabel) => {
                          const rSeats = (rowMap.get(rowLabel) || []).sort((a, b) => a.seatNumber - b.seatNumber);

                          return (
                            <div key={rowLabel} className="flex items-center justify-center gap-2">
                              {/* Left Row Label */}
                              <span className="w-5 text-center text-xs font-bold text-zinc-500">
                                {rowLabel}
                              </span>

                              {/* Seats Array with center aisle partition (between cols 6 and 7) */}
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                {rSeats.map((seat) => {
                                  const isAisleBreak = seat.seatNumber === 7;
                                  const isInspected = inspectedSeat?.seatId === seat.seatId;

                                  // Status styling
                                  let seatStyle = "bg-zinc-900 border-zinc-700/80 text-zinc-300 hover:border-emerald-400 hover:text-emerald-300 hover:scale-105";
                                  let iconElement: React.ReactNode = seat.seatNumber;

                                  if (seat.status === "BOOKED") {
                                    seatStyle = "bg-rose-600 border-rose-500 text-white font-bold shadow-sm shadow-rose-600/40 hover:brightness-110";
                                    iconElement = <Check className="w-3 h-3" />;
                                  } else if (seat.status === "LOCKED") {
                                    seatStyle = "bg-amber-500/20 border-amber-400 text-amber-300 font-bold animate-pulse hover:bg-amber-500/30";
                                    iconElement = <Lock className="w-2.5 h-2.5" />;
                                  } else if (seat.status === "BLOCKED") {
                                    seatStyle = "bg-zinc-800 border-zinc-600 text-zinc-400 cursor-pointer hover:border-zinc-400";
                                    iconElement = <Wrench className="w-2.5 h-2.5 text-zinc-400" />;
                                  }

                                  if (isInspected) {
                                    seatStyle += " ring-2 ring-primary ring-offset-2 ring-offset-zinc-950 scale-110";
                                  }

                                  return (
                                    <React.Fragment key={seat.seatId}>
                                      {isAisleBreak && (
                                        <div className="w-4 sm:w-8" aria-hidden="true" />
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => setInspectedSeat(seat)}
                                        title={`${seat.label} - ${seat.status}`}
                                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-t-lg rounded-b-sm text-[11px] font-semibold transition-all duration-150 flex items-center justify-center border ${seatStyle}`}
                                      >
                                        {iconElement}
                                      </button>
                                    </React.Fragment>
                                  );
                                })}
                              </div>

                              {/* Right Row Label */}
                              <span className="w-5 text-center text-xs font-bold text-zinc-500">
                                {rowLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Curved Cinema Screen Bar */}
              <div className="w-full pt-8 pb-2 flex flex-col items-center space-y-2.5">
                <div className="w-3/4 max-w-md h-1.5 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent rounded-full blur-sm" />
                <div className="relative w-full max-w-sm h-5">
                  <svg viewBox="0 0 400 30" className="w-full h-full text-zinc-600 overflow-visible" preserveAspectRatio="none">
                    <path
                      d="M 10,25 Q 200,5 390,25"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className="drop-shadow-[0_4px_12px_rgba(56,189,248,0.35)]"
                    />
                  </svg>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-zinc-500">
                  <Armchair className="w-3.5 h-3.5 text-cyan-400/80" />
                  <span>All Eyes This Way Please (Front of Cinema)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature 2 & 3: Seat Detail Inspector & Maintenance Action Panel (4 cols) ── */}
        <div className="xl:col-span-4 space-y-5">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Seat Telemetry Inspector
              </h3>
              {inspectedSeat && (
                <button
                  type="button"
                  onClick={() => setInspectedSeat(null)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {!inspectedSeat ? (
              <div className="py-12 text-center text-zinc-500 space-y-2">
                <Armchair className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-xs font-medium">Click on any seat in the heatmap to inspect live metadata or execute maintenance overrides.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Seat Identifier Header */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <div>
                    <span className="text-xs font-bold text-zinc-400 uppercase">Seat Identifier</span>
                    <div className="text-xl font-black text-white">{inspectedSeat.label}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Tier & Price</span>
                    <div className="text-sm font-bold text-primary">
                      {inspectedSeat.tier} • ₹{inspectedSeat.price}
                    </div>
                  </div>
                </div>

                {/* Status Pill */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Current Status:</span>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold uppercase text-[11px] ${
                      inspectedSeat.status === "BOOKED"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : inspectedSeat.status === "LOCKED"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                        : inspectedSeat.status === "BLOCKED"
                        ? "bg-zinc-800 text-zinc-300 border border-zinc-600"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {inspectedSeat.status === "BOOKED"
                      ? "Booked (Confirmed)"
                      : inspectedSeat.status === "LOCKED"
                      ? "In Checkout (Redis Lock)"
                      : inspectedSeat.status === "BLOCKED"
                      ? "Blocked (Maintenance)"
                      : "Available"}
                  </span>
                </div>

                {/* Confirmed Booking Inspection Details */}
                {inspectedSeat.status === "BOOKED" && inspectedSeat.booking && (
                  <div className="p-3.5 rounded-lg bg-rose-500/5 border border-rose-500/20 space-y-2 text-xs">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
                      Booking Record
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1 text-zinc-300">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Booking Ref</span>
                        <span className="font-mono font-bold text-zinc-100">{inspectedSeat.booking.bookingRef}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Amount Paid</span>
                        <span className="font-bold text-emerald-400">₹{inspectedSeat.booking.amountPaid}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-zinc-500 block">Customer Name</span>
                        <span className="font-medium text-zinc-100">{inspectedSeat.booking.customerName}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-zinc-500 block">Contact</span>
                        <span className="text-zinc-400 font-mono text-[11px] truncate block">
                          {inspectedSeat.booking.customerEmail} • {inspectedSeat.booking.customerPhone}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Redis Lock Inspection Details & Force Release Action */}
                {inspectedSeat.status === "LOCKED" && inspectedSeat.lock && (
                  <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-3 text-xs">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Active Concurrency Lock
                    </div>
                    <p className="text-zinc-300 text-[11px]">
                      A customer is currently checking out this seat. Lock automatically flushes when 5-minute TTL expires.
                    </p>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-[11px] text-zinc-400">TTL Remaining:</span>
                      <span className="font-mono font-bold text-amber-300">{inspectedSeat.lock.remainingSeconds} seconds</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleForceReleaseLock(inspectedSeat.seatId)}
                      className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      Force Release Lock Now
                    </button>
                  </div>
                )}

                {/* Maintenance Block Actions */}
                {inspectedSeat.status !== "BOOKED" && inspectedSeat.status !== "LOCKED" && (
                  <div className="pt-2 space-y-3">
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {inspectedSeat.status === "BLOCKED"
                        ? "This seat is currently disabled in the customer matrix for maintenance, damaged hardware, or VIP hold."
                        : "Toggle this seat to block it from customer selection for physical repair, social distancing, or VIP reservation."}
                    </p>

                    <button
                      type="button"
                      onClick={() => handleToggleBlockSeat(inspectedSeat)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md ${
                        inspectedSeat.status === "BLOCKED"
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                          : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                      }`}
                    >
                      {inspectedSeat.status === "BLOCKED" ? (
                        <>
                          <Check className="w-4 h-4" />
                          Unblock Seat (Mark Available)
                        </>
                      ) : (
                        <>
                          <Wrench className="w-4 h-4 text-amber-400" />
                          Block Seat for Maintenance
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Screening Summary Card */}
          {currentScreening && (
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs space-y-2 text-zinc-400">
              <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-primary" />
                Auditorium Summary
              </div>
              <div className="flex justify-between">
                <span>Cinema:</span>
                <span className="font-semibold text-zinc-200">{currentScreening.cinemaName}</span>
              </div>
              <div className="flex justify-between">
                <span>Auditorium:</span>
                <span className="font-semibold text-zinc-200">{currentScreening.screenName}</span>
              </div>
              <div className="flex justify-between">
                <span>Movie:</span>
                <span className="font-semibold text-primary">{currentScreening.movieTitle}</span>
              </div>
              <div className="flex justify-between">
                <span>Screening Time:</span>
                <span className="font-mono text-zinc-200">{currentScreening.startTime} – {currentScreening.endTime}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminTelemetry;
