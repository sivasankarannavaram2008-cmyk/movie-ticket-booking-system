import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getShowSeatLocks, getBlockedSeats } from "@/lib/redis";
import { getShowsStore, StoredShow } from "@/lib/shows-store";
import { getBookingStore, StoredBooking } from "@/lib/booking-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface TelemetrySeatDetail {
  seatId: string;
  rowLabel: string;
  seatNumber: number;
  label: string;
  tier: "CLASSIC" | "PRIME" | "RECLINER";
  price: number;
  status: "AVAILABLE" | "LOCKED" | "BOOKED" | "BLOCKED";
  booking?: {
    bookingRef: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    amountPaid: number;
    bookedAt: string;
  };
  lock?: {
    userId: string;
    remainingSeconds: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showId = searchParams.get("showId");
    const allStoreShows = getShowsStore();

    // If no specific showId requested, return list of available screenings with summary
    if (!showId) {
      const summaryList = allStoreShows.map((s) => ({
        showId: s.id,
        movieId: s.movieId,
        movieTitle: s.movieTitle,
        cinemaId: s.cinemaId,
        cinemaName: s.cinemaName,
        citySlug: s.citySlug,
        cityName: s.cityName,
        screenId: s.screenId,
        screenName: s.screenName,
        screenTier: s.screenTier,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        classicPrice: s.classicPrice,
        primePrice: s.primePrice,
        reclinerPrice: s.reclinerPrice,
      }));

      return NextResponse.json({ screenings: summaryList }, { status: 200 });
    }

    // 1. Resolve Show Metadata
    let showMeta: StoredShow | undefined = allStoreShows.find((s) => s.id === showId);

    if (!showMeta && isSupabaseConfigured()) {
      try {
        const { data: dbShow } = await supabaseAdmin
          .from("shows")
          .select(`
            id, date, start_time, end_time,
            movies ( id, title ),
            screens ( id, name, screen_tier,
              cinemas ( id, name, address, cities ( slug, name ) )
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
          const sCity = sCinema?.cities;

          showMeta = {
            id: dbShow.id,
            screenId: sScreen?.id || "screen-1",
            screenName: sScreen?.name || "Audi 1",
            screenTier: sScreen?.screen_tier || "Standard",
            cinemaId: sCinema?.id || "c-1",
            cinemaName: sCinema?.name || "Multiplex",
            cinemaAddress: sCinema?.address || "Cinema Avenue",
            citySlug: sCity?.slug || "mumbai",
            cityName: sCity?.name || "Mumbai",
            movieId: sMovie?.id || "m-1",
            movieTitle: sMovie?.title || "Feature Presentation",
            date: dbShow.date,
            startTime: dbShow.start_time.slice(0, 5),
            endTime: dbShow.end_time ? dbShow.end_time.slice(0, 5) : "21:00",
            formatBadge: sScreen?.screen_tier === "IMAX" ? "IMAX 3D Laser" : "Dolby Atmos",
            classicPrice: 220,
            primePrice: 350,
            reclinerPrice: 580,
            createdAt: new Date().toISOString(),
          };
        }
      } catch (err) {
        console.warn("Supabase show lookup notice:", err);
      }
    }

    if (!showMeta) {
      // Fallback default show
      showMeta = allStoreShows[0] || {
        id: showId,
        screenId: "screen-mum-1-1",
        screenName: "Audi 1 - Laser IMAX",
        screenTier: "IMAX",
        cinemaId: "c-1",
        cinemaName: "PVR INOX Palladium",
        cinemaAddress: "High Street Phoenix, Lower Parel",
        citySlug: "mumbai",
        cityName: "Mumbai",
        movieId: "m-1",
        movieTitle: "Baahubali: The Beginning",
        date: new Date().toISOString().split("T")[0],
        startTime: "10:30 AM",
        endTime: "01:45 PM",
        formatBadge: "IMAX 3D Laser",
        classicPrice: 280,
        primePrice: 420,
        reclinerPrice: 700,
        createdAt: new Date().toISOString(),
      };
    }

    // 2. Fetch Confirmed Bookings for Show
    const bookedSeatMap = new Map<
      string,
      {
        bookingRef: string;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        amountPaid: number;
        bookedAt: string;
      }
    >();

    let totalRevenue = 0;

    // Check in-memory booking store
    const memBookings = getBookingStore().filter((b) => b.showId === showId && b.status !== "CANCELLED");
    for (const b of memBookings) {
      totalRevenue += Number(b.totalAmount) || 0;
      const seatPrice = b.seats.length > 0 ? Math.round(b.totalAmount / b.seats.length) : b.totalAmount;
      for (const sLabel of b.seats) {
        bookedSeatMap.set(sLabel, {
          bookingRef: b.refId,
          customerName: b.customerName,
          customerEmail: b.customerEmail,
          customerPhone: b.customerPhone,
          amountPaid: seatPrice,
          bookedAt: b.createdAt,
        });
      }
    }

    // Check Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data: dbBookings } = await supabaseAdmin
          .from("bookings")
          .select(`
            id, booking_ref, user_name, user_email, user_phone, total_amount, created_at, status,
            booking_seats ( seat_id )
          `)
          .eq("show_id", showId)
          .neq("status", "CANCELLED");

        if (dbBookings && dbBookings.length > 0) {
          for (const b of dbBookings) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const bSeats: any[] = b.booking_seats || [];
            const seatPrice = bSeats.length > 0 ? Math.round(Number(b.total_amount) / bSeats.length) : Number(b.total_amount);
            totalRevenue += Number(b.total_amount) || 0;

            for (const bs of bSeats) {
              const seatLabel = bs.seat_id;
              if (seatLabel && !bookedSeatMap.has(seatLabel)) {
                bookedSeatMap.set(seatLabel, {
                  bookingRef: b.booking_ref || b.id.slice(0, 8).toUpperCase(),
                  customerName: b.user_name,
                  customerEmail: b.user_email,
                  customerPhone: b.user_phone,
                  amountPaid: seatPrice,
                  bookedAt: b.created_at,
                });
              }
            }
          }
        }
      } catch (dbErr) {
        console.warn("Supabase telemetry bookings notice:", dbErr);
      }
    }

    // 3. Fetch Active Redis Locks
    const activeLocks = await getShowSeatLocks(showId);
    const lockMap = new Map<string, { userId: string; remainingSeconds: number }>();
    activeLocks.forEach((l) => {
      lockMap.set(l.seatId, { userId: l.userId, remainingSeconds: l.remainingSeconds });
    });

    // 4. Fetch Blocked Maintenance Seats
    const blockedSeats = await getBlockedSeats(showId);
    const blockedSet = new Set(blockedSeats);

    // 5. Generate 15x12 Matrix Telemetry (180 seats: Rows A-O, Cols 1-12)
    const rows = [
      { label: "O", tier: "RECLINER" as const, price: showMeta.reclinerPrice },
      { label: "N", tier: "RECLINER" as const, price: showMeta.reclinerPrice },
      { label: "M", tier: "RECLINER" as const, price: showMeta.reclinerPrice },
      { label: "L", tier: "PRIME" as const, price: showMeta.primePrice },
      { label: "K", tier: "PRIME" as const, price: showMeta.primePrice },
      { label: "J", tier: "PRIME" as const, price: showMeta.primePrice },
      { label: "I", tier: "PRIME" as const, price: showMeta.primePrice },
      { label: "H", tier: "PRIME" as const, price: showMeta.primePrice },
      { label: "G", tier: "PRIME" as const, price: showMeta.primePrice },
      { label: "F", tier: "PRIME" as const, price: showMeta.primePrice },
      { label: "E", tier: "CLASSIC" as const, price: showMeta.classicPrice },
      { label: "D", tier: "CLASSIC" as const, price: showMeta.classicPrice },
      { label: "C", tier: "CLASSIC" as const, price: showMeta.classicPrice },
      { label: "B", tier: "CLASSIC" as const, price: showMeta.classicPrice },
      { label: "A", tier: "CLASSIC" as const, price: showMeta.classicPrice },
    ];

    const seatDetails: TelemetrySeatDetail[] = [];
    let countBooked = 0;
    let countLocked = 0;
    let countBlocked = 0;
    let countAvailable = 0;

    for (const r of rows) {
      for (let num = 1; num <= 12; num++) {
        const seatId = `${r.label}${num}`;
        const altKey = `seat-${r.label}-${num}`;

        let status: TelemetrySeatDetail["status"] = "AVAILABLE";
        const booking = bookedSeatMap.get(seatId) || bookedSeatMap.get(altKey);
        const lock = lockMap.get(seatId) || lockMap.get(altKey);
        const isBlocked = blockedSet.has(seatId) || blockedSet.has(altKey);

        if (booking) {
          status = "BOOKED";
          countBooked++;
        } else if (lock) {
          status = "LOCKED";
          countLocked++;
        } else if (isBlocked) {
          status = "BLOCKED";
          countBlocked++;
        } else {
          status = "AVAILABLE";
          countAvailable++;
        }

        seatDetails.push({
          seatId,
          rowLabel: r.label,
          seatNumber: num,
          label: `${r.label}${num}`,
          tier: r.tier,
          price: r.price,
          status,
          booking,
          lock,
        });
      }
    }

    const totalSeats = 180;
    const occupancyRate = Math.round(((countBooked + countLocked) / totalSeats) * 100);

    return NextResponse.json(
      {
        show: showMeta,
        stats: {
          totalSeats,
          availableSeats: countAvailable,
          lockedSeats: countLocked,
          bookedSeats: countBooked,
          blockedSeats: countBlocked,
          occupancyRate,
          revenueCollected: totalRevenue,
        },
        activeLocks,
        blockedSeats,
        seatMatrix: seatDetails,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("GET /api/admin/telemetry error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load telemetry" },
      { status: 500 }
    );
  }
}
