"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ShieldCheck,
  CheckCircle2,
  X,
  CreditCard,
  QrCode,
  Sparkles,
  Hourglass,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeatMatrix, SeatData } from "@/components/booking/SeatMatrix";
import { MOCK_MOVIES, CITIES, getDefaultCinemaForCity } from "@/lib/mock-data";
import { useCity } from "@/context/CityContext";
import { supabase } from "@/lib/supabase";
import { generateTicketQRCode } from "@/lib/qrcode/ticket-qr";

interface ShowMeta {
  showId: string;
  movieId: string;
  movieTitle: string;
  posterUrl: string;
  cinemaName: string;
  cinemaAddress: string;
  screenName: string;
  screenTier: string;
  date: string;
  time: string;
}

function BookingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedCity, setCity } = useCity();

  const showId = (params.showId as string) || "show-1";
  const paramCity = searchParams.get("city") || searchParams.get("citySlug");
  const citySlug = paramCity || selectedCity.slug || "hyderabad";
  const movieIdParam = searchParams.get("movieId");

  const currentCity = CITIES.find((c) => c.slug.toLowerCase() === citySlug.toLowerCase()) || selectedCity;
  const matchedMovie =
    MOCK_MOVIES.find((m) => m.id === movieIdParam) || MOCK_MOVIES[0];

  // Sync if URL has explicit city param that differs from context
  useEffect(() => {
    if (paramCity && paramCity.toLowerCase() !== selectedCity.slug.toLowerCase()) {
      setCity(paramCity);
    }
  }, [paramCity, selectedCity.slug, setCity]);

  // Persistent Client Session User ID for distributed locking
  const [userId, setUserId] = useState<string>("");
  useEffect(() => {
    if (typeof window !== "undefined") {
      let stored = sessionStorage.getItem("mtbs_user_id");
      if (!stored) {
        stored = `user_${Math.random().toString(36).substring(2, 10)}`;
        sessionStorage.setItem("mtbs_user_id", stored);
      }
      setUserId(stored);
    }
  }, []);

  // Show metadata
  const defaultCinema = getDefaultCinemaForCity(citySlug, showId);
  const [showMeta, setShowMeta] = useState<ShowMeta>({
    showId,
    movieId: matchedMovie.id,
    movieTitle: matchedMovie.title,
    posterUrl: matchedMovie.poster_url,
    cinemaName: defaultCinema.cinemaName,
    cinemaAddress: defaultCinema.cinemaAddress,
    screenName: defaultCinema.screenName,
    screenTier: defaultCinema.screenTier,
    date: new Date().toISOString().split("T")[0],
    time: "07:30 PM",
  });

  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [lockedByOthersSeatIds, setLockedByOthersSeatIds] = useState<string[]>([]);
  const [blockedSeatIds, setBlockedSeatIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // 5-minute Reservation Countdown Timer (Upstash TTL)
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [countdownText, setCountdownText] = useState<string | null>(null);
  const [isExpiredAlertOpen, setIsExpiredAlertOpen] = useState(false);

  // Modal checkout state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [userName, setUserName] = useState("Aditya Sharma");
  const [userEmail, setUserEmail] = useState("aditya.sharma@example.com");
  const [userPhone, setUserPhone] = useState("+91 98765 43210");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    bookingId: string;
    qrDataUrl: string;
  } | null>(null);

  // 1. Fetch Show and Seats
  useEffect(() => {
    async function loadShowAndSeats() {
      setIsLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let fetchedShow: any = null;

        // 1. Try local API first (checks shows-store + Supabase)
        try {
          const res = await fetch(`/api/shows?showId=${encodeURIComponent(showId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.show) {
              fetchedShow = data.show;
            }
          }
        } catch (e) {
          console.warn("API shows fetch notice:", e);
        }

        // 2. If not found via API, try Supabase directly
        if (!fetchedShow) {
          try {
            const { data: dbShow } = await supabase
              .from("shows")
              .select(`
                id,
                date,
                start_time,
                movies (id, title, poster_url),
                screens (
                  id,
                  name,
                  screen_tier,
                  cinemas (id, name, address)
                )
              `)
              .eq("id", showId)
              .maybeSingle();

            if (dbShow) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const sMovie: any = dbShow.movies;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const sScreen: any = dbShow.screens;
              const sCinema = sScreen?.cinemas;

              fetchedShow = {
                id: dbShow.id,
                movieId: sMovie?.id || matchedMovie.id,
                movieTitle: sMovie?.title || matchedMovie.title,
                cinemaName: sCinema?.name || defaultCinema.cinemaName,
                cinemaAddress: sCinema?.address || defaultCinema.cinemaAddress,
                screenName: sScreen?.name || defaultCinema.screenName,
                screenTier: sScreen?.screen_tier || defaultCinema.screenTier,
                date: dbShow.date,
                startTime: dbShow.start_time.slice(0, 5),
                classicPrice: 220,
                primePrice: 350,
                reclinerPrice: 580,
              };
            }
          } catch (dbErr) {
            console.warn("Supabase show query notice:", dbErr);
          }
        }

        const movieObj =
          MOCK_MOVIES.find(
            (m) => m.id === fetchedShow?.movieId || m.title === fetchedShow?.movieTitle
          ) || matchedMovie;

        const classicPrice = Number(fetchedShow?.classicPrice) || 220;
        const primePrice = Number(fetchedShow?.primePrice) || 350;
        const reclinerPrice = Number(fetchedShow?.reclinerPrice) || 580;

        setShowMeta({
          showId: fetchedShow?.id || showId,
          movieId: movieObj.id,
          movieTitle: movieObj.title,
          posterUrl: movieObj.poster_url,
          cinemaName: fetchedShow?.cinemaName || defaultCinema.cinemaName,
          cinemaAddress: fetchedShow?.cinemaAddress || defaultCinema.cinemaAddress,
          screenName: fetchedShow?.screenName || defaultCinema.screenName,
          screenTier: fetchedShow?.formatBadge || fetchedShow?.screenTier || defaultCinema.screenTier,
          date: fetchedShow?.date || new Date().toISOString().split("T")[0],
          time: fetchedShow?.startTime || "07:30 PM",
        });

        // 100% Database-Driven Occupied & Blocked Seats
        const occupiedSeatIdSet = new Set<string>();
        try {
          const { data: dbBookedSeats } = await supabase
            .from("booking_seats")
            .select(`
              seat_id,
              seats (
                row_label,
                seat_number
              ),
              bookings!inner(show_id, status)
            `)
            .eq("bookings.show_id", showId)
            .neq("bookings.status", "CANCELLED");

          if (dbBookedSeats) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dbBookedSeats.forEach((b: any) => {
              if (b.seat_id) occupiedSeatIdSet.add(b.seat_id);
              if (b.seats?.row_label && b.seats?.seat_number) {
                occupiedSeatIdSet.add(`${b.seats.row_label}${b.seats.seat_number}`);
                occupiedSeatIdSet.add(`seat-${b.seats.row_label}-${b.seats.seat_number}`);
                occupiedSeatIdSet.add(`${b.seats.row_label}-${b.seats.seat_number}`);
              }
            });
          }
        } catch {
          // ignore
        }

        // Also fetch from /api/seats/status for active locks, maintenance blocks, and live booked seats
        try {
          const statusRes = await fetch(`/api/seats/status?showId=${encodeURIComponent(showId)}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.bookedSeats && Array.isArray(statusData.bookedSeats)) {
              statusData.bookedSeats.forEach((s: string) => occupiedSeatIdSet.add(s));
            }
            if (statusData.blockedSeats && Array.isArray(statusData.blockedSeats)) {
              setBlockedSeatIds(statusData.blockedSeats);
            }
          }
        } catch {
          // ignore
        }

        // Generate exact 15-row (A to O) x 12-column (1 to 12) grid:
        // Rows:
        // Classic: Rows A to E (Columns 1-12) -> classicPrice
        // Prime: Rows F to L (Columns 1-12) -> primePrice
        // Recliner: Rows M to O (Columns 1-12) -> reclinerPrice
        const rowsConfig: Array<{
          label: string;
          tier: "CLASSIC" | "PRIME" | "RECLINER";
          price: number;
        }> = [
          // Recliner (M to O)
          { label: "O", tier: "RECLINER", price: reclinerPrice },
          { label: "N", tier: "RECLINER", price: reclinerPrice },
          { label: "M", tier: "RECLINER", price: reclinerPrice },
          // Prime (F to L)
          { label: "L", tier: "PRIME", price: primePrice },
          { label: "K", tier: "PRIME", price: primePrice },
          { label: "J", tier: "PRIME", price: primePrice },
          { label: "I", tier: "PRIME", price: primePrice },
          { label: "H", tier: "PRIME", price: primePrice },
          { label: "G", tier: "PRIME", price: primePrice },
          { label: "F", tier: "PRIME", price: primePrice },
          // Classic (A to E)
          { label: "E", tier: "CLASSIC", price: classicPrice },
          { label: "D", tier: "CLASSIC", price: classicPrice },
          { label: "C", tier: "CLASSIC", price: classicPrice },
          { label: "B", tier: "CLASSIC", price: classicPrice },
          { label: "A", tier: "CLASSIC", price: classicPrice },
        ];

        const generatedSeats: SeatData[] = [];
        rowsConfig.forEach((row) => {
          for (let num = 1; num <= 12; num++) {
            const seatId = `${row.label}${num}`;
            const isOccupied =
              occupiedSeatIdSet.has(seatId) ||
              occupiedSeatIdSet.has(`seat-${row.label}-${num}`) ||
              occupiedSeatIdSet.has(`${row.label}-${num}`);

            generatedSeats.push({
              id: seatId,
              rowLabel: row.label,
              seatNumber: num,
              label: `${row.label}${num}`,
              seatType: row.tier,
              price: row.price,
              isOccupied,
            });
          }
        });

        setSeats(generatedSeats);
      } catch (err) {
        console.warn("Using fallback seat layout:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadShowAndSeats();
  }, [showId, matchedMovie]);

  // 2. Poll Active Seat Locks from Redis (/api/seats/status)
  useEffect(() => {
    async function fetchLocks() {
      if (!showId) return;
      try {
        const res = await fetch(`/api/seats/status?showId=${encodeURIComponent(showId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.activeLocks && Array.isArray(data.activeLocks)) {
            // Filter locks held by other users
            const otherUserLocks = data.activeLocks
              .filter((l: { userId: string }) => l.userId !== userId)
              .map((l: { seatId: string }) => l.seatId);

            setLockedByOthersSeatIds(otherUserLocks);

            // If any of the user's currently selected seats got locked by someone else
            setSelectedSeatIds((prev) => {
              const colliding = prev.filter((id) => otherUserLocks.includes(id));
              if (colliding.length > 0) {
                setErrorNotice(
                  `Notice: Seat(s) ${colliding.join(", ")} were reserved by another customer.`
                );
                return prev.filter((id) => !otherUserLocks.includes(id));
              }
              return prev;
            });
          }

          // Handle Maintenance / Blocked Seats from Admin Telemetry
          if (data.blockedSeats && Array.isArray(data.blockedSeats)) {
            const blockedList = data.blockedSeats;
            setBlockedSeatIds(blockedList);
            setSeats((prev) =>
              prev.map((s) => ({
                ...s,
                isBlocked:
                  blockedList.includes(s.id) ||
                  blockedList.includes(`seat-${s.rowLabel}-${s.seatNumber}`),
              }))
            );

            setSelectedSeatIds((prev) => {
              const blockedColliding = prev.filter(
                (id) => blockedList.includes(id) || blockedList.includes(`seat-${id}`)
              );
              if (blockedColliding.length > 0) {
                setErrorNotice(
                  `Notice: Seat(s) ${blockedColliding.join(", ")} were placed on maintenance hold by theater staff.`
                );
                return prev.filter((id) => !blockedList.includes(id) && !blockedList.includes(`seat-${id}`));
              }
              return prev;
            });
          }

          // Handle Live Booked Seats updates
          if (data.bookedSeats && Array.isArray(data.bookedSeats)) {
            const bookedList = data.bookedSeats;
            setSeats((prev) =>
              prev.map((s) => {
                const isBooked =
                  bookedList.includes(s.id) ||
                  bookedList.includes(`seat-${s.rowLabel}-${s.seatNumber}`) ||
                  bookedList.includes(`${s.rowLabel}-${s.seatNumber}`);
                return { ...s, isOccupied: isBooked };
              })
            );
          }
        }
      } catch (err) {
        console.warn("Polling active seat locks:", err);
      }
    }

    fetchLocks();
    const interval = setInterval(fetchLocks, 5000);
    return () => clearInterval(interval);
  }, [showId, userId]);

  // 3. 5-Minute Countdown Timer Hook
  useEffect(() => {
    if (!lockExpiresAt) {
      setCountdownText(null);
      return;
    }

    const timer = setInterval(() => {
      const remainingMs = lockExpiresAt - Date.now();
      if (remainingMs <= 0) {
        clearInterval(timer);
        setCountdownText("00:00");
        handleReservationExpired();
      } else {
        const totalSecs = Math.floor(remainingMs / 1000);
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, "0");
        const secs = String(totalSecs % 60).padStart(2, "0");
        setCountdownText(`${mins}:${secs}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockExpiresAt]);

  // Handle Automatic Lock Expiration (00:00)
  const handleReservationExpired = async () => {
    if (selectedSeatIds.length > 0 && userId) {
      try {
        await fetch("/api/seats/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            showId,
            seatIds: selectedSeatIds,
            userId,
          }),
        });
      } catch (err) {
        console.error("Error unlocking on expiry:", err);
      }
    }

    setIsCheckoutOpen(false);
    setSelectedSeatIds([]);
    setLockExpiresAt(null);
    setCountdownText(null);
    setIsExpiredAlertOpen(true);
  };

  // Toggle seat selection
  const handleToggleSeat = (seat: SeatData) => {
    setErrorNotice(null);

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 10) {
        setErrorNotice("You can select a maximum of 10 seats per booking.");
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Calculations
  const selectedSeatObjects = useMemo(() => {
    return seats.filter((s) => selectedSeatIds.includes(s.id));
  }, [seats, selectedSeatIds]);

  const baseTicketAmount = useMemo(() => {
    return selectedSeatObjects.reduce((acc, curr) => acc + curr.price, 0);
  }, [selectedSeatObjects]);

  const convenienceFee = selectedSeatObjects.length > 0 ? selectedSeatObjects.length * 30 : 0;
  const taxes = Math.round(convenienceFee * 0.18);
  const grandTotal = baseTicketAmount + convenienceFee + taxes;

  // 4. Concurrency Lock: When user clicks "Proceed to Pay"
  const handleProceedToPay = async () => {
    if (selectedSeatIds.length === 0) return;
    setErrorNotice(null);
    setIsProcessing(true);

    try {
      const res = await fetch("/api/seats/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId,
          seatIds: selectedSeatIds,
          userId,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        // Seat Lock Collision
        const colliding = data.collidingSeatIds || [];
        const collidingLabels = seats
          .filter((s) => colliding.includes(s.id))
          .map((s) => s.label);

        setErrorNotice(
          `Seat(s) ${collidingLabels.join(", ") || colliding.join(", ")} are currently held by another customer. Please reselect.`
        );

        // Remove colliding seats from current selection and mark locked
        setLockedByOthersSeatIds((prev) => Array.from(new Set([...prev, ...colliding])));
        setSelectedSeatIds((prev) => prev.filter((id) => !colliding.includes(id)));
        return;
      }

      if (!res.ok) {
        setErrorNotice(data.error || "Failed to reserve seats. Please try again.");
        return;
      }

      // Success: Lock acquired for 5 minutes (300 seconds)
      const seatLabels = selectedSeatObjects.map((s) => s.label).join(",");
      const seatIdsParam = selectedSeatIds.join(",");
      router.push(
        `/booking/${showId}/checkout?seats=${encodeURIComponent(seatLabels)}&seatIds=${encodeURIComponent(seatIdsParam)}&userId=${encodeURIComponent(userId)}&movieId=${encodeURIComponent(showMeta.movieId)}&city=${encodeURIComponent(citySlug)}`
      );
    } catch (err) {
      console.error("Lock error:", err);
      setErrorNotice("Network error while reserving seats. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Close Checkout Modal & Release Lock
  const handleCancelCheckout = async () => {
    setIsCheckoutOpen(false);
    if (selectedSeatIds.length > 0 && userId) {
      try {
        await fetch("/api/seats/unlock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            showId,
            seatIds: selectedSeatIds,
            userId,
          }),
        });
      } catch (err) {
        console.error("Error releasing lock:", err);
      }
    }
    setLockExpiresAt(null);
    setCountdownText(null);
  };

  // 5. Final Payment Confirmation
  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const bookingRef = `BMS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const qrPayload = JSON.stringify({
        bookingRef,
        movie: showMeta.movieTitle,
        cinema: showMeta.cinemaName,
        seats: selectedSeatObjects.map((s) => s.label).join(", "),
        date: showMeta.date,
        time: showMeta.time,
        total: grandTotal,
      });

      const qrDataUrl = await generateTicketQRCode(qrPayload);

      // Save to Supabase
      try {
        const { data: newBooking } = await supabase
          .from("bookings")
          .insert({
            show_id: showMeta.showId,
            user_name: userName,
            user_email: userEmail,
            user_phone: userPhone,
            total_amount: grandTotal,
            status: "CONFIRMED",
            qr_code_hash: bookingRef,
          })
          .select("id")
          .maybeSingle();

        if (newBooking) {
          const bookingSeats = selectedSeatObjects.map((s) => ({
            booking_id: newBooking.id,
            seat_id: s.id,
          }));
          await supabase.from("booking_seats").insert(bookingSeats);
        }
      } catch (dbErr) {
        console.warn("Simulated booking insert:", dbErr);
      }

      setConfirmedBooking({
        bookingId: bookingRef,
        qrDataUrl,
      });
      setLockExpiresAt(null);
      setCountdownText(null);
    } catch (err) {
      console.error("Booking error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* 1. Show Header & Cinema Metadata */}
      <header className="sticky top-16 z-30 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href={`/movie/${showMeta.movieId}?city=${encodeURIComponent(citySlug)}`}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors shrink-0"
              title="Return to Showtimes"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight leading-tight">
                  {showMeta.movieTitle}
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                  {showMeta.screenTier}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                {showMeta.cinemaName} • {showMeta.screenName} ({currentCity.name})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>{showMeta.date}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{showMeta.time}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Interactive Seat Matrix */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
            <div className="w-64 h-8 bg-zinc-900 rounded-xl" />
            <div className="w-full max-w-2xl h-80 bg-zinc-900 rounded-2xl" />
          </div>
        ) : (
          <SeatMatrix
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            lockedByOthersSeatIds={lockedByOthersSeatIds}
            blockedSeatIds={blockedSeatIds}
            onToggleSeat={handleToggleSeat}
            maxSeats={10}
            errorNotice={errorNotice}
            countdownTimer={countdownText}
          />
        )}
      </main>

      {/* 3. Sticky Checkout Summary Bar */}
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 py-3.5 px-4 sm:px-6 lg:px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="space-y-0.5">
              <div className="text-xs text-zinc-400 font-medium">
                Selected Seats ({selectedSeatObjects.length}/10):
              </div>
              <div className="flex flex-wrap items-center gap-1 max-w-sm">
                {selectedSeatObjects.length > 0 ? (
                  selectedSeatObjects.map((s) => (
                    <span
                      key={s.id}
                      className="text-xs font-bold text-white bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded"
                    >
                      {s.label}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500 italic">No seats selected yet</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-zinc-850 pt-2 sm:pt-0">
            <div className="text-left sm:text-right">
              <div className="text-[10px] uppercase font-bold text-zinc-500">Total Price</div>
              <div className="text-xl font-black text-white">
                ₹{grandTotal.toFixed(2)}
              </div>
            </div>

            <Button
              size="lg"
              disabled={selectedSeatIds.length === 0 || isProcessing}
              onClick={handleProceedToPay}
              className="font-bold gap-2 px-6 bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              <Ticket className="w-4 h-4" />
              {isProcessing ? "Locking Seats..." : "Proceed to Pay"}
            </Button>
          </div>
        </div>
      </footer>

      {/* 4. Reservation Expired Alert Dialog */}
      {isExpiredAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-zinc-950 p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Hourglass className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Reservation Expired</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your 5-minute seat hold window has elapsed. The seats have been released back into the pool. Please reselect your preferred seats to continue.
              </p>
            </div>
            <Button
              onClick={() => setIsExpiredAlertOpen(false)}
              className="w-full bg-primary hover:bg-primary-hover font-semibold text-xs"
            >
              Got It, Reselect Seats
            </Button>
          </div>
        </div>
      )}

      {/* 5. Checkout & Payment Confirmation Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-5">
            {confirmedBooking ? (
              <div className="text-center space-y-5 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Booking Confirmed!
                  </span>
                  <h3 className="text-2xl font-black text-white">Enjoy Your Movie!</h3>
                  <p className="text-xs text-zinc-400">
                    Reference ID: <strong className="text-white">{confirmedBooking.bookingId}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white max-w-[200px] mx-auto shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={confirmedBooking.qrDataUrl}
                    alt="Ticket QR Code"
                    className="w-full h-auto object-contain"
                  />
                </div>

                <div className="text-xs text-zinc-400 space-y-1 bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl">
                  <div>
                    <strong className="text-white">{showMeta.movieTitle}</strong> • {showMeta.cinemaName}
                  </div>
                  <div>
                    Seats: <span className="text-primary font-bold">{selectedSeatObjects.map((s) => s.label).join(", ")}</span> | {showMeta.date} at {showMeta.time}
                  </div>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setConfirmedBooking(null);
                      setSelectedSeatIds([]);
                      router.push(`/?city=${encodeURIComponent(citySlug)}`);
                    }}
                  >
                    Back to Home
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-white">Booking Summary</h3>
                  </div>
                  <button
                    onClick={handleCancelCheckout}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Countdown Warning Bar */}
                {countdownText && (
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                      Complete payment before seats release:
                    </span>
                    <span className="font-mono font-black text-white text-sm bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {countdownText}
                    </span>
                  </div>
                )}

                {/* Ticket Details */}
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-2 text-xs">
                  <div className="flex justify-between font-bold text-sm text-white">
                    <span>{showMeta.movieTitle}</span>
                    <span className="text-primary">{showMeta.screenTier}</span>
                  </div>
                  <div className="text-zinc-400">
                    {showMeta.cinemaName} • {showMeta.screenName}
                  </div>
                  <div className="text-zinc-400 flex items-center gap-2">
                    <span>{showMeta.date}</span>
                    <span>•</span>
                    <span>{showMeta.time}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-zinc-800 text-zinc-300">
                    <span>Selected Seats:</span>
                    <span className="font-bold text-white">
                      {selectedSeatObjects.map((s) => s.label).join(", ")}
                    </span>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Contact Details
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-primary"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-primary"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="space-y-1.5 border-t border-zinc-850 pt-3 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Ticket Base Fare ({selectedSeatObjects.length} seats)</span>
                    <span className="text-white font-medium">₹{baseTicketAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Convenience Fees (₹30/seat)</span>
                    <span className="text-white font-medium">₹{convenienceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integrated GST (18%)</span>
                    <span className="text-white font-medium">₹{taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-extrabold text-white">
                    <span>Total Amount Payable</span>
                    <span className="text-primary">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="w-full font-bold gap-2 py-3 bg-primary hover:bg-primary-hover shadow-lg shadow-primary/30"
                >
                  <CreditCard className="w-4 h-4" />
                  {isProcessing ? "Processing Ticket..." : `Pay ₹${grandTotal.toFixed(2)}`}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-6">
          <div className="h-20 bg-zinc-900 rounded-xl animate-pulse" />
          <div className="h-96 bg-zinc-900 rounded-2xl animate-pulse" />
        </div>
      }
    >
      <BookingContent />
    </Suspense>
  );
}
