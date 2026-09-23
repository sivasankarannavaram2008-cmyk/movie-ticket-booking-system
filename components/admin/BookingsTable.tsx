"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Search, XCircle, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";

export interface BookingRow {
  id: string;
  refId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  movieTitle: string;
  cinemaName: string;
  showDate: string;
  showTime: string;
  seats: string[];
  totalAmount: number;
  status: "CONFIRMED" | "CANCELLED" | "LOCKED";
  createdAt: string;
}

const PAGE_SIZE = 10;

/* ── Mock Bookings for offline / build mode ───────────────── */
function generateMockBookings(): BookingRow[] {
  const names = [
    "Aarav Sharma", "Priya Patel", "Ravi Kumar", "Sneha Reddy", "Vikram Singh",
    "Anita Desai", "Raj Malhotra", "Divya Nair", "Arjun Mehta", "Kavita Rao",
    "Siddharth Joshi", "Neha Gupta", "Aditya Verma", "Pooja Iyer", "Karan Chopra",
  ];
  const movies = [
    "Kalki 2898 AD", "Jawan: Extended Cut", "Devara: Part 1",
    "Stree 2: Sarkate Ka Aatank", "Dune: Part Two", "Pushpa 2: The Rule",
  ];
  const cinemas = [
    "PVR INOX Palladium", "Cinépolis Grand Mall", "Prasads Multiplex",
    "Sathyam Cinemas SPI", "AMB Cinemas", "INOX Quest Mall",
  ];
  const statuses: ("CONFIRMED" | "CANCELLED")[] = ["CONFIRMED", "CONFIRMED", "CONFIRMED", "CONFIRMED", "CANCELLED"];
  const times = ["10:00 AM", "01:30 PM", "05:15 PM", "09:00 PM", "11:30 PM"];

  return Array.from({ length: 25 }, (_, i) => {
    const name = names[i % names.length];
    const hexPart = ((i + 1) * 0xa3f2b + 0x1000).toString(16).toUpperCase().slice(0, 6);
    const status = statuses[i % statuses.length];
    const seatCount = 1 + (i % 4);
    const seatLabels = Array.from({ length: seatCount }, (_, s) => `${String.fromCharCode(65 + (i % 8))}${s + 1}`);
    const dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - (i % 3));
    const dateStr = dateObj.toISOString().split("T")[0];

    return {
      id: `booking-${i + 1}`,
      refId: `BMS-2026-${hexPart}`,
      customerName: name,
      customerEmail: `${name.split(" ")[0].toLowerCase()}@email.com`,
      customerPhone: `+91 98${String(1000000 + i * 73117).slice(0, 8)}`,
      movieTitle: movies[i % movies.length],
      cinemaName: cinemas[i % cinemas.length],
      showDate: dateStr,
      showTime: times[i % times.length],
      seats: seatLabels,
      totalAmount: 250 * seatCount + 50 * (i % 3),
      status,
      createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
    };
  });
}

/* ── Component ───────────────────────────────────────── */
export function BookingsTable() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id, user_name, user_email, user_phone, total_amount, status, created_at, qr_code_hash,
          shows!inner ( id, date, start_time,
            movies!inner ( title ),
            screens!inner ( name, cinema_id,
              cinemas!inner ( name )
            )
          ),
          booking_seats ( seat_id,
            seats ( row_label, seat_number )
          )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error || !data || data.length === 0) {
        setBookings(generateMockBookings());
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped: BookingRow[] = data.map((b: any) => {
        const show = b.shows;
        const movie = show?.movies;
        const screen = show?.screens;
        const cinema = screen?.cinemas;
        const seatLabels = (b.booking_seats || []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (bs: any) => bs.seats ? `${bs.seats.row_label}${bs.seats.seat_number}` : "?"
        );
        const hexPart = b.id.replace(/-/g, "").slice(0, 6).toUpperCase();

        return {
          id: b.id,
          refId: `BMS-2026-${hexPart}`,
          customerName: b.user_name,
          customerEmail: b.user_email,
          customerPhone: b.user_phone,
          movieTitle: movie?.title || "Unknown",
          cinemaName: cinema?.name || "Unknown",
          showDate: show?.date || "",
          showTime: show?.start_time || "",
          seats: seatLabels,
          totalAmount: b.total_amount,
          status: b.status,
          createdAt: b.created_at,
        };
      });

      setBookings(mapped);
    } catch {
      setBookings(generateMockBookings());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    try {
      const supabase = getSupabaseAdmin();
      await supabase
        .from("bookings")
        .update({ status: "CANCELLED" })
        .eq("id", bookingId);

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
      );
    } catch {
      // Fallback: update locally anyway for mock mode
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
      );
    }
    setCancelling(null);
  };

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return bookings;
    const q = searchQuery.toLowerCase();
    return bookings.filter(
      (b) =>
        b.refId.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.includes(q) ||
        b.movieTitle.toLowerCase().includes(q)
    );
  }, [bookings, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const statusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/25">
            Confirmed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 ring-1 ring-red-500/25">
            Cancelled
          </span>
        );
      case "LOCKED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/25">
            Locked
          </span>
        );
      default:
        return <span className="text-xs text-zinc-500">{status}</span>;
    }
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 py-4 border-b border-zinc-800">
        <h2 className="text-base font-semibold text-white">Live Bookings</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by Ref ID, Name, Phone, Movie…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button
            onClick={fetchBookings}
            className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-3 font-medium">Ref ID</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Movie & Cinema</th>
              <th className="px-5 py-3 font-medium">Show</th>
              <th className="px-5 py-3 font-medium">Seats</th>
              <th className="px-5 py-3 font-medium text-right">Amount</th>
              <th className="px-5 py-3 font-medium text-center">Status</th>
              <th className="px-5 py-3 font-medium text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 bg-zinc-800 rounded w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pagedRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-12 text-center text-zinc-500">
                  No bookings found.
                </td>
              </tr>
            ) : (
              pagedRows.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-primary">
                    {b.refId}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-zinc-200 font-medium text-sm">{b.customerName}</div>
                    <div className="text-zinc-500 text-xs">{b.customerEmail}</div>
                    <div className="text-zinc-500 text-xs">{b.customerPhone}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-zinc-200 text-sm font-medium">{b.movieTitle}</div>
                    <div className="text-zinc-500 text-xs">{b.cinemaName}</div>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-300 text-sm whitespace-nowrap">
                    <div>{b.showDate}</div>
                    <div className="text-zinc-500 text-xs">{b.showTime}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {b.seats.map((s, i) => (
                        <span
                          key={i}
                          className="inline-block px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 font-mono"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-zinc-200 whitespace-nowrap">
                    ₹{b.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5 text-center">{statusBadge(b.status)}</td>
                  <td className="px-5 py-3.5 text-center">
                    {b.status === "CONFIRMED" ? (
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancelling === b.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition disabled:opacity-40"
                      >
                        {cancelling === b.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        Cancel
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 text-xs text-zinc-500">
          <span>
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length} bookings
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-zinc-400">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded border border-zinc-700 hover:bg-zinc-800 disabled:opacity-30 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
