import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { getBookingStore, cancelBookingInStore, StoredBooking } from "@/lib/booking-store";
import { releaseSeatLocks } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    let bookings: StoredBooking[] = [];

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabaseAdmin
          .from("bookings")
          .select(`
            id,
            booking_ref,
            user_name,
            user_email,
            user_phone,
            total_amount,
            status,
            created_at,
            qr_code_hash,
            shows (
              id,
              start_time,
              date,
              movies (title),
              screens (
                name,
                cinemas (name)
              )
            ),
            booking_seats (
              seat_id,
              seats (row_label, seat_number)
            )
          `)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          bookings = data.map((b: any) => {
            const show = b.shows;
            const movie = show?.movies;
            const screen = show?.screens;
            const cinema = screen?.cinemas || show?.cinemas;

            const seatLabels: string[] = [];
            const seatIds: string[] = [];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (b.booking_seats || []).forEach((bs: any) => {
              if (bs.seats?.row_label && bs.seats?.seat_number) {
                seatLabels.push(`${bs.seats.row_label}${bs.seats.seat_number}`);
              } else if (bs.seat_id) {
                seatLabels.push(bs.seat_id.slice(-3).toUpperCase());
              }
              if (bs.seat_id) {
                seatIds.push(bs.seat_id);
              }
            });

            const hexPart = b.id ? b.id.replace(/-/g, "").slice(0, 6).toUpperCase() : "REF";
            const refId = b.booking_ref || b.qr_code_hash || `BMS-2026-${hexPart}`;

            return {
              id: b.id,
              refId,
              showId: show?.id || b.show_id || "",
              customerName: b.user_name || "Guest Customer",
              customerEmail: b.user_email || "N/A",
              customerPhone: b.user_phone || "N/A",
              movieTitle: movie?.title || "Movie Presentation",
              cinemaName: cinema?.name || "Cinema Venue",
              screenName: screen?.name || "Audi",
              showDate: show?.date || (b.created_at ? b.created_at.split("T")[0] : ""),
              showTime: show?.start_time ? show.start_time.slice(0, 5) : "",
              seats: seatLabels.length > 0 ? seatLabels : ["1 Ticket"],
              seatIds,
              totalAmount: Number(b.total_amount) || 0,
              status: b.status || "CONFIRMED",
              createdAt: b.created_at || new Date().toISOString(),
            };
          });
        }
      } catch (dbErr) {
        console.warn("Supabase bookings fetch warning, using unified store:", dbErr);
      }
    }

    // If Supabase was empty or offline, use our unified booking store
    if (bookings.length === 0) {
      bookings = getBookingStore();
    } else {
      // Merge in-memory bookings that may not yet be in Supabase (e.g. created during current runtime)
      const inMem = getBookingStore();
      const existingIds = new Set(bookings.map((b) => b.id));
      for (const item of inMem) {
        if (!existingIds.has(item.id)) {
          bookings.unshift(item);
        }
      }
    }

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/bookings error:", err);
    return NextResponse.json({ bookings: getBookingStore() }, { status: 200 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, showId, seatIds } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // 1. Try Supabase cancellation if configured
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin
          .from("bookings")
          .update({ status: "CANCELLED" })
          .eq("id", bookingId);

        await supabaseAdmin
          .from("booking_seats")
          .delete()
          .eq("booking_id", bookingId);
      } catch (dbErr) {
        console.warn("Supabase cancel warning:", dbErr);
      }
    }

    // 2. Cancel in unified booking store
    cancelBookingInStore(bookingId);

    // 3. Release locks if showId and seatIds provided
    if (showId && seatIds && Array.isArray(seatIds)) {
      try {
        await releaseSeatLocks(showId, seatIds, "admin", true);
      } catch (lockErr) {
        console.warn("Redis unlock warning during cancellation:", lockErr);
      }
    }

    return NextResponse.json({ success: true, bookingId }, { status: 200 });
  } catch (err) {
    console.error("PATCH /api/admin/bookings error:", err);
    return NextResponse.json({ error: "Failed to update booking status" }, { status: 500 });
  }
}
