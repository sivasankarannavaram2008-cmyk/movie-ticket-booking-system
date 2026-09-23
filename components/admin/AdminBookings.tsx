"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Film,
  Calendar,
  Clock,
  Phone,
  User,
  Ticket,
} from "lucide-react";

export interface BookingDetails {
  id: string;
  refId: string;
  showId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  movieTitle: string;
  cinemaName: string;
  screenName: string;
  showDate: string;
  showTime: string;
  seats: string[];
  seatIds: string[];
  totalAmount: number;
  status: "CONFIRMED" | "CANCELLED" | "LOCKED";
  createdAt: string;
}

const PAGE_SIZE = 10;

export interface AdminBookingsProps {
  refreshTrigger?: number;
}

export function AdminBookings({ refreshTrigger }: AdminBookingsProps = {}) {
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CONFIRMED" | "CANCELLED">("ALL");
  const [page, setPage] = useState(0);

  // Cancellation state
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Fetch bookings unexpected error:", err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings, refreshTrigger]);

  // Cancel and refund handler
  const handleCancelAndRefund = async (booking: BookingDetails) => {
    if (booking.status === "CANCELLED") return;

    const confirmed = window.confirm(
      `Confirm cancellation and refund for ${booking.refId} (${booking.customerName})?\nRefund Amount: ₹${booking.totalAmount.toLocaleString("en-IN")}`
    );
    if (!confirmed) return;

    setActionInProgress(booking.id);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          reason: `Admin refund processed for ${booking.customerName} (${booking.refId})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel booking");

      // Update state locally without full page refresh
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id || b.refId === booking.refId ? { ...b, status: "CANCELLED" } : b))
      );

      setNotification({
        message: `Booking ${booking.refId} successfully cancelled. ₹${booking.totalAmount.toLocaleString("en-IN")} refunded & seats released.`,
        type: "success",
      });
    } catch (err) {
      console.error("Cancellation error:", err);
      setNotification({
        message: `Error cancelling booking ${booking.refId}. Please check server connection.`,
        type: "error",
      });
    } finally {
      setActionInProgress(null);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Filtered list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Status filter
      if (statusFilter !== "ALL" && b.status !== statusFilter) {
        return false;
      }
      // Live search filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        b.refId.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerPhone.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.movieTitle.toLowerCase().includes(q)
      );
    });
  }, [bookings, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const pagedRows = filteredBookings.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* ── Notification Banner ── */}
      {notification && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm animate-in fade-in slide-in-from-top-2 ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by Ref ID, Customer Name, Phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition"
          />
        </div>

        {/* Status Filters & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-zinc-950 border border-zinc-800 p-1 rounded-lg">
            {(["ALL", "CONFIRMED", "CANCELLED"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(0);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  statusFilter === tab
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab === "ALL" ? "All Bookings" : tab === "CONFIRMED" ? "Confirmed" : "Cancelled"}
              </button>
            ))}
          </div>

          <button
            onClick={fetchBookings}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-xs font-semibold transition disabled:opacity-50 active:scale-95"
            title="Refresh bookings from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Bookings Data Table ── */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/40 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3.5">Booking Ref</th>
                <th className="px-5 py-3.5">Customer Details</th>
                <th className="px-5 py-3.5">Movie & Screening</th>
                <th className="px-5 py-3.5">Seats & Count</th>
                <th className="px-5 py-3.5 text-right">Amount</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-zinc-800 rounded mb-1.5" /><div className="h-3 w-24 bg-zinc-800/60 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-36 bg-zinc-800 rounded mb-1.5" /><div className="h-3 w-28 bg-zinc-800/60 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-zinc-800 rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-zinc-800 rounded ml-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-5 w-20 bg-zinc-800 rounded-full mx-auto" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-8 w-28 bg-zinc-800 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-zinc-500">
                    <Ticket className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                    <p className="text-base font-medium text-zinc-400">No bookings found in database yet.</p>
                    <p className="text-xs text-zinc-600 mt-1">Confirmed customer reservations will appear here automatically.</p>
                  </td>
                </tr>
              ) : (
                pagedRows.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-zinc-800/30 transition-colors group"
                  >
                    {/* Booking Ref */}
                    <td className="px-5 py-4 font-mono text-xs text-primary font-semibold whitespace-nowrap">
                      {b.refId}
                      <div className="text-[10px] text-zinc-500 font-sans mt-0.5">
                        {new Date(b.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>

                    {/* Customer Info */}
                    <td className="px-5 py-4">
                      <div className="text-zinc-200 font-medium text-sm flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        {b.customerName}
                      </div>
                      <div className="text-zinc-400 text-xs flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                        {b.customerPhone}
                      </div>
                      <div className="text-zinc-500 text-[11px] truncate max-w-[180px]">
                        {b.customerEmail}
                      </div>
                    </td>

                    {/* Movie & Venue */}
                    <td className="px-5 py-4">
                      <div className="text-zinc-200 font-medium text-sm flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{b.movieTitle}</span>
                      </div>
                      <div className="text-zinc-400 text-xs mt-0.5 truncate max-w-[220px]">
                        {b.cinemaName} • {b.screenName}
                      </div>
                      <div className="text-zinc-500 text-[11px] flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {b.showDate}
                        </span>
                        {b.showTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-zinc-500" />
                            {b.showTime}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Seats */}
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {b.seats.map((seat, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-block px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-xs text-zinc-300"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1">
                        {b.seats.length} {b.seats.length === 1 ? "seat" : "seats"}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-4 text-right font-bold text-zinc-100 whitespace-nowrap text-sm">
                      ₹{b.totalAmount.toLocaleString("en-IN")}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {b.status === "CONFIRMED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmed
                        </span>
                      ) : b.status === "CANCELLED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 ring-1 ring-red-500/30">
                          <XCircle className="w-3 h-3" />
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30">
                          Locked
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {b.status === "CONFIRMED" ? (
                        <button
                          onClick={() => handleCancelAndRefund(b)}
                          disabled={actionInProgress === b.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 active:scale-95 transition disabled:opacity-50"
                        >
                          {actionInProgress === b.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                          )}
                          Cancel & Refund
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500 italic">Refunded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/40 text-xs text-zinc-400">
          <div>
            Showing{" "}
            <span className="font-semibold text-zinc-200">
              {filteredBookings.length === 0 ? 0 : page * PAGE_SIZE + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-zinc-200">
              {Math.min((page + 1) * PAGE_SIZE, filteredBookings.length)}
            </span>{" "}
            of <span className="font-semibold text-zinc-200">{filteredBookings.length}</span> bookings
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-zinc-400">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-md border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminBookings;
