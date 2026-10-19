"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Printer,
  Home,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  Share2,
  Sparkles,
  Download,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateTicketQRCode } from "@/lib/qrcode/ticket-qr";
import { InMemTicket } from "@/types/ticket";
import { MOCK_MOVIES } from "@/lib/mock-data";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

function TicketContent() {
  const params = useParams();
  const bookingId = (params.bookingId as string) || (params.id as string) || "BMS-2026-TEST";

  const [ticket, setTicket] = useState<InMemTicket | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    async function loadTicket() {
      setIsLoading(true);
      setIsNotFound(false);
      try {
        // 1. Direct relational query to Supabase if configured
        if (isSupabaseConfigured()) {
          try {
            let bookingQuery = supabase
              .from("bookings")
              .select(`
                *,
                shows (
                  id,
                  date,
                  start_time,
                  movies (
                    id,
                    title,
                    description,
                    poster_url,
                    backdrop_url
                  ),
                  screens (
                    id,
                    name,
                    screen_tier,
                    cinemas (
                      id,
                      name,
                      address,
                      cities (
                        name,
                        slug
                      )
                    )
                  )
                ),
                booking_seats (
                  seat_id,
                  price,
                  seats (
                    id,
                    row_label,
                    seat_number,
                    price
                  )
                )
              `);

            if (isValidUUID(bookingId)) {
              bookingQuery = bookingQuery.or(`id.eq.${bookingId},qr_code_hash.eq.${bookingId}`);
            } else {
              bookingQuery = bookingQuery.or(`booking_ref.eq.${bookingId},qr_code_hash.eq.${bookingId}`);
            }

            const { data: booking, error: bErr } = await bookingQuery.maybeSingle();

            if (booking && !bErr) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rawShows: any = booking.shows;
              const showObj: any = Array.isArray(rawShows) ? rawShows[0] : rawShows;
              const rawMovies: any = showObj?.movies;
              const movieObj: any = Array.isArray(rawMovies) ? rawMovies[0] : rawMovies;

              const rawScreens: any = showObj?.screens;
              const screenObj: any = Array.isArray(rawScreens) ? rawScreens[0] : rawScreens;
              const rawCinemas: any = screenObj?.cinemas;
              const cinemaObj: any = Array.isArray(rawCinemas) ? rawCinemas[0] : rawCinemas;
              const rawCities: any = cinemaObj?.cities;
              const cityObj: any = Array.isArray(rawCities) ? rawCities[0] : rawCities;

              // Handle both array or object structures returned by Supabase
              let movieTitle =
                movieObj?.title ||
                (Array.isArray(showObj?.movies) ? showObj.movies[0]?.title : null) ||
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (booking as any)?.movie_title;

              if (!movieTitle || movieTitle === "Feature Film") {
                if (showObj?.movie_id) {
                  const { data: dbM } = await supabase.from("movies").select("title, poster_url, backdrop_url, description").eq("id", showObj.movie_id).maybeSingle();
                  if (dbM?.title) movieTitle = dbM.title;
                }
              }

              movieTitle = movieTitle && movieTitle !== "Feature Film" ? movieTitle : "Movie";

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rawBookingSeats: any[] = booking.booking_seats || [];
              const seatLabels = rawBookingSeats
                .map((bs) => (bs.seats?.row_label && bs.seats?.seat_number ? `${bs.seats.row_label}${bs.seats.seat_number}` : null))
                .filter(Boolean) as string[];

              const cinemaName = cinemaObj?.name
                ? (cityObj?.name ? `${cinemaObj.name} (${cityObj.name})` : cinemaObj.name)
                : "Multiplex Cinema";

              const t: InMemTicket = {
                bookingId: booking.id,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                referenceHash: (booking as any).booking_ref || booking.qr_code_hash || `BMS-${booking.id.substring(0, 8)}`,
                showId: showObj?.id || "show",
                movieTitle,
                cinemaName,
                screenName: screenObj?.name || "Screen 1",
                date: showObj?.date || new Date().toISOString().split("T")[0],
                time: showObj?.start_time?.slice(0, 5) || "07:30 PM",
                seatLabels: seatLabels.length > 0 ? seatLabels : ["Confirmed"],
                userName: booking.user_name || "Valued Customer",
                userEmail: booking.user_email || "",
                userPhone: booking.user_phone || "",
                totalAmount: Number(booking.total_amount),
                posterUrl: movieObj?.poster_url || null,
                backdropUrl: movieObj?.backdrop_url || null,
                description: movieObj?.description || null,
                qrData: JSON.stringify({
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ref: (booking as any).booking_ref || booking.qr_code_hash,
                  id: booking.id,
                  movie: movieTitle,
                  cinema: cinemaName,
                  seats: seatLabels.join(", "),
                  date: showObj?.date,
                  time: showObj?.start_time?.slice(0, 5),
                }),
                createdAt: booking.created_at,
              };

              setTicket(t);
              const qr = await generateTicketQRCode(t.qrData || t.referenceHash);
              setQrCodeUrl(qr);
              return;
            }
          } catch (supErr) {
            console.warn("Direct Supabase ticket lookup note:", supErr);
          }
        }

        // 2. Fallback to API endpoint
        const res = await fetch(`/api/bookings/confirm?bookingId=${encodeURIComponent(bookingId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.ticket) {
            const apiTicket = data.ticket;
            if (!apiTicket.movieTitle || apiTicket.movieTitle === "Feature Film") {
              apiTicket.movieTitle = "Movie";
            }
            setTicket(apiTicket);
            const qr = await generateTicketQRCode(apiTicket.qrData || apiTicket.referenceHash);
            setQrCodeUrl(qr);
            return;
          }
        }

        setIsNotFound(true);
      } catch (err) {
        console.error("Error loading ticket:", err);
        setIsNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadTicket();
  }, [bookingId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-20 bg-zinc-900 rounded-2xl" />
        <div className="h-96 bg-zinc-900 rounded-3xl" />
      </div>
    );
  }

  if (isNotFound || !ticket) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-xl">
          <AlertCircle className="w-8 h-8 text-rose-500" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-2xl font-black text-white">Ticket Not Found</h2>
          <p className="text-sm text-zinc-400">
            We could not find an active reservation for reference{" "}
            <span className="font-mono text-zinc-200 font-semibold px-2 py-0.5 rounded bg-zinc-850">
              {bookingId}
            </span>
            .
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-colors shadow-lg shadow-primary/20"
          >
            View Admin Orders
          </Link>
        </div>
      </div>
    );
  }

  // CRITICAL: Database poster_url and backdrop_url are NULL.
  // Enforce sleek dark cinema placeholder and remove any external photo fallback.
  const posterUrl = null;
  const backdropUrl = null;

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      {/* Top Banner Message */}
      <div className="max-w-xl mx-auto text-center space-y-2 mb-8 print:hidden">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-lg shadow-emerald-500/15">
          <CheckCircle2 className="w-4 h-4" />
          Booking Confirmed & Verified
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">Your Movie Admission Pass</h1>
        <p className="text-xs text-zinc-400">
          Booking ID: <strong className="text-white tracking-wider">{ticket.referenceHash}</strong>
        </p>
      </div>

      {/* CLASSIC PERFORATED MOVIE TICKET CARD */}
      <div className="max-w-xl mx-auto bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative print:border-black print:text-black">
        {/* TOP SECTION: Movie Poster & Screening Info */}
        <div className="relative p-6 sm:p-8 space-y-5 overflow-hidden">
          {/* Subtle dark cinema ambient backdrop aura */}
          <div className="absolute inset-0 opacity-25 pointer-events-none">
            <div className="w-full h-full bg-gradient-to-tr from-rose-950/40 via-zinc-900 to-amber-950/30" />
          </div>

          {/* Ticket Header Brand Bar */}
          <div className="relative z-10 flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-sm shadow-primary/30">
                <Ticket className="w-3.5 h-3.5" />
              </div>
              <span className="font-black text-sm text-white tracking-wide">
                My <span className="text-primary">Movie</span> Booking
              </span>
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Digital Admission Pass
            </span>
          </div>

          <div className="relative z-10 flex gap-5 items-start">
            {/* Uniform Dark Cinema Placeholder Card */}
            <div className="w-20 h-28 rounded-xl bg-zinc-800/90 border border-zinc-700/60 flex flex-col items-center justify-center p-2 text-center shadow-inner shrink-0">
              <span className="text-2xl mb-1">🎬</span>
              <span className="text-[9px] font-bold tracking-wider text-amber-400 uppercase">IMAX</span>
              <span className="text-[8px] text-zinc-400 tracking-tight mt-0.5">RELEASE</span>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                {ticket.screenName.includes("IMAX") ? "IMAX 3D Laser" : "Dolby Atmos 7.1"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {ticket.movieTitle}
              </h2>
              <p className="text-xs font-medium text-zinc-400">
                {ticket.cinemaName}
              </p>
              <p className="text-[11px] text-zinc-500">
                {ticket.screenName}
              </p>
            </div>
          </div>

          {/* Schedule & Seats Matrix Strip */}
          <div className="relative z-10 grid grid-cols-3 gap-2 p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-850 text-center">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Date
              </span>
              <div className="text-xs sm:text-sm font-black text-white">{ticket.date}</div>
            </div>

            <div className="space-y-0.5 border-x border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Time
              </span>
              <div className="text-xs sm:text-sm font-black text-emerald-400">{ticket.time}</div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Seats
              </span>
              <div className="text-xs sm:text-sm font-black text-primary truncate px-1">
                {ticket.seatLabels.join(", ")}
              </div>
            </div>
          </div>
        </div>

        {/* PERFORATION TEAR LINE WITH SEMICIRCULAR NOTCH CUTOUTS */}
        <div className="relative flex items-center justify-between py-2">
          {/* Left Notch Cutout */}
          <div className="w-6 h-6 rounded-full bg-background -ml-3 border-r border-zinc-800 shrink-0" />

          {/* Dotted Perforation Line */}
          <div className="flex-1 border-b-2 border-dashed border-zinc-800 mx-2" />

          {/* Right Notch Cutout */}
          <div className="w-6 h-6 rounded-full bg-background -mr-3 border-l border-zinc-800 shrink-0" />
        </div>

        {/* BOTTOM SECTION: QR Code & Verification Stub */}
        <div className="p-6 sm:p-8 bg-zinc-950/90 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Scannable QR Code */}
            <div className="p-3 bg-white rounded-2xl shadow-xl shrink-0">
              {qrCodeUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCodeUrl}
                  alt="Entry QR Code"
                  className="w-32 h-32 object-contain"
                />
              ) : (
                <div className="w-32 h-32 flex items-center justify-center text-black">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Verification Metadata */}
            <div className="space-y-2 text-center sm:text-left text-xs text-zinc-400">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold block">
                  Booked For
                </span>
                <span className="font-bold text-white text-sm">{ticket.userName}</span>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold block">
                  Contact
                </span>
                <span>{ticket.userEmail}</span>
              </div>

              <div>
                <span className="text-zinc-500 text-[10px] uppercase font-bold block">
                  Total Paid
                </span>
                <span className="font-black text-base text-primary">
                  ₹{ticket.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-850 pt-3 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-zinc-500">
            <span>Please present this QR pass at the cinema turnstile for admission.</span>
            <span className="font-semibold text-zinc-400">My Movie Booking</span>
          </div>
        </div>
      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="max-w-xl mx-auto mt-8 flex flex-wrap items-center justify-center gap-4 print:hidden">
        <Button
          onClick={handlePrint}
          className="font-bold gap-2 px-6 bg-zinc-800 hover:bg-zinc-700 text-white shadow-lg"
        >
          <Printer className="w-4 h-4" />
          Download PDF / Print Ticket
        </Button>

        <Link href="/">
          <Button variant="outline" className="font-bold gap-2 px-6">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Print-specific style */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, nav {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto py-20 text-center text-zinc-400">
          Loading ticket pass...
        </div>
      }
    >
      <TicketContent />
    </Suspense>
  );
}
