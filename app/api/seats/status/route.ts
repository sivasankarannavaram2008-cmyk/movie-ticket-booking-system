import { NextRequest, NextResponse } from "next/server";
import { getShowSeatLocks, getBlockedSeats } from "@/lib/redis";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getBookingStore } from "@/lib/booking-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showId = searchParams.get("showId");

    if (!showId) {
      return NextResponse.json(
        { error: "Missing required query parameter: showId" },
        { status: 400 }
      );
    }

    const [activeLocks, blockedSeats] = await Promise.all([
      getShowSeatLocks(showId),
      getBlockedSeats(showId),
    ]);

    const bookedSeatSet = new Set<string>();

    // 1. Query Supabase for confirmed/non-cancelled bookings
    if (isSupabaseConfigured()) {
      try {
        const { data: dbBooked } = await supabaseAdmin
          .from("booking_seats")
          .select(`
            seat_id,
            seats (
              row_label,
              seat_number
            ),
            bookings!inner (
              show_id,
              status
            )
          `)
          .eq("bookings.show_id", showId)
          .neq("bookings.status", "CANCELLED");

        if (dbBooked) {
          for (const b of dbBooked) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const s: any = b.seats;
            if (s?.row_label && s?.seat_number) {
              bookedSeatSet.add(`${s.row_label}${s.seat_number}`);
              bookedSeatSet.add(`seat-${s.row_label}-${s.seat_number}`);
            }
            if (b.seat_id) {
              bookedSeatSet.add(b.seat_id);
            }
          }
        }
      } catch (err) {
        console.warn("Supabase booked seats query warning in /api/seats/status:", err);
      }
    }

    // 2. Also check active bookings in local store
    const memBookings = getBookingStore().filter(
      (b) => b.showId === showId && b.status !== "CANCELLED"
    );
    for (const b of memBookings) {
      if (b.seats) {
        for (const s of b.seats) {
          bookedSeatSet.add(s);
        }
      }
      if (b.seatIds) {
        for (const id of b.seatIds) {
          bookedSeatSet.add(id);
        }
      }
    }

    const bookedSeats = Array.from(bookedSeatSet);

    return NextResponse.json(
      {
        showId,
        activeLocks,
        blockedSeats,
        bookedSeats,
        count: activeLocks.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API /api/seats/status error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve active seat locks." },
      { status: 500 }
    );
  }
}
