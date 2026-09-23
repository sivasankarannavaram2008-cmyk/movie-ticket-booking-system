import { NextRequest, NextResponse } from "next/server";
import { releaseSeatLocks, isRedisConfigured, redis } from "@/lib/redis";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { InMemTicket } from "@/types/ticket";
import { addBookingToStore, getBookingStore, StoredBooking } from "@/lib/booking-store";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Global registry for immediate client ticket rendering and offline fallback
declare global {
  // eslint-disable-next-line no-var
  var __mockTicketsRegistry: Map<string, InMemTicket> | undefined;
}

if (!global.__mockTicketsRegistry) {
  global.__mockTicketsRegistry = new Map<string, InMemTicket>();
}

function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      showId,
      seatIds,
      userName,
      userEmail,
      userPhone,
      totalAmount,
      bookingRef: customBookingRef,
      seatLabels = [],
      userId,
      movieTitle = "Blockbuster Movie",
      cinemaName = "PVR INOX Palladium",
      screenName = "Audi 1 (IMAX)",
      date = new Date().toISOString().split("T")[0],
      time = "07:30 PM",
    } = body;

    // 1. Validation
    if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid booking request: missing showId or seatIds." },
        { status: 400 }
      );
    }

    if (!userName || !userEmail || !userPhone) {
      return NextResponse.json(
        { error: "Contact information (name, email, phone) is required." },
        { status: 400 }
      );
    }

    // 2. Concurrency check: If Redis is configured and userId provided, verify lock ownership
    if (isRedisConfigured() && userId) {
      for (const seatId of seatIds) {
        const key = `seat_lock:${showId}:${seatId}`;
        const holder = await redis.get<string>(key);
        if (holder && holder !== userId) {
          return NextResponse.json(
            {
              error: `Lock validation failed: seat ${seatId} is held by another session.`,
            },
            { status: 409 }
          );
        }
      }
    }

    // 3. Establish consistent booking reference
    const bookingRef =
      customBookingRef ||
      `BMS-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // Resolve a valid UUID for showId and insert to Supabase if configured
    let targetShowId = showId;
    let createdBookingId = bookingRef;

    if (isSupabaseConfigured()) {
      if (!isValidUUID(targetShowId)) {
        try {
          const { data: firstShow } = await supabaseAdmin
            .from("shows")
            .select("id")
            .limit(1)
            .maybeSingle();
          if (firstShow?.id) {
            targetShowId = firstShow.id;
          }
        } catch (err) {
          console.warn("Could not query fallback show UUID:", err);
        }
      }

      // 4. Insert row into public.bookings table in Supabase
      try {
        // Primary insert attempt with booking_ref
        let insertRes = await supabaseAdmin
          .from("bookings")
          .insert({
            user_name: userName,
            user_email: userEmail,
            user_phone: userPhone,
            show_id: targetShowId,
            total_amount: Number(totalAmount),
            booking_ref: bookingRef,
            qr_code_hash: bookingRef,
            status: "CONFIRMED",
          })
          .select("id")
          .single();

        // Fallback if booking_ref column is not present in existing live DB instance
        if (insertRes.error && insertRes.error.message.includes("booking_ref")) {
          insertRes = await supabaseAdmin
            .from("bookings")
            .insert({
              user_name: userName,
              user_email: userEmail,
              user_phone: userPhone,
              show_id: targetShowId,
              total_amount: Number(totalAmount),
              qr_code_hash: bookingRef,
              status: "CONFIRMED",
            })
            .select("id")
            .single();
        }

        if (insertRes.data?.id) {
          createdBookingId = insertRes.data.id;

          // 5. Insert rows into booking_seats for each seatId tied to newly created booking ID
          let validSeatIds = seatIds.filter(isValidUUID);
          if (validSeatIds.length === 0) {
            // If mock seatIds were used, map them to real seats in database if available
            const { data: realSeats } = await supabaseAdmin
              .from("seats")
              .select("id")
              .limit(seatIds.length);
            if (realSeats && realSeats.length > 0) {
              validSeatIds = realSeats.map((s) => s.id);
            }
          }

          if (validSeatIds.length > 0) {
            const seatsToInsert = validSeatIds.map((sId: string) => ({
              booking_id: createdBookingId,
              seat_id: sId,
            }));

            const { error: seatInsertErr } = await supabaseAdmin
              .from("booking_seats")
              .insert(seatsToInsert);

            if (seatInsertErr) {
              console.warn("booking_seats insert notice:", seatInsertErr.message);
            }
          }
        } else if (insertRes.error) {
          console.warn("bookings insert warning (using fallback):", insertRes.error.message);
        }
      } catch (dbErr) {
        console.warn("Supabase database communication notice:", dbErr);
      }
    }

    // 6. Delete/release any active Redis locks for those seats (force = true ensures cleanup)
    try {
      await releaseSeatLocks(showId, seatIds, userId || "admin", true);
    } catch (lockErr) {
      console.warn("Redis unlock notice:", lockErr);
    }

    // 7. Store in-memory record for high-speed client ticket page rendering
    const inMemRecord: InMemTicket = {
      bookingId: createdBookingId,
      referenceHash: bookingRef,
      showId,
      movieTitle,
      cinemaName,
      screenName,
      date,
      time,
      seatLabels: seatLabels.length > 0 ? seatLabels : seatIds,
      userName,
      userEmail,
      userPhone,
      totalAmount: Number(totalAmount),
      qrData: JSON.stringify({
        ref: bookingRef,
        bookingId: createdBookingId,
        movie: movieTitle,
        cinema: cinemaName,
        seats: seatLabels.join(", ") || seatIds.join(", "),
        date,
        time,
        total: totalAmount,
        customer: userName,
      }),
      createdAt: new Date().toISOString(),
    };

    global.__mockTicketsRegistry?.set(createdBookingId, inMemRecord);
    global.__mockTicketsRegistry?.set(bookingRef, inMemRecord);

    // Save to global unified booking store so Admin Portal immediately reflects this reservation
    const storedBooking: StoredBooking = {
      id: createdBookingId,
      refId: bookingRef,
      showId,
      customerName: userName,
      customerEmail: userEmail,
      customerPhone: userPhone,
      movieTitle: movieTitle || "Blockbuster Movie",
      cinemaName: cinemaName || "PVR INOX Palladium",
      screenName: screenName || "Audi 1 (IMAX)",
      showDate: date || new Date().toISOString().split("T")[0],
      showTime: time || "07:30 PM",
      seats: seatLabels.length > 0 ? seatLabels : seatIds,
      seatIds: seatIds,
      totalAmount: Number(totalAmount) || 0,
      status: "CONFIRMED",
      createdAt: new Date().toISOString(),
    };
    addBookingToStore(storedBooking);

    // 8. Return response: { success: true, bookingId: data.id }
    return NextResponse.json(
      {
        success: true,
        bookingId: createdBookingId,
        referenceId: bookingRef,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("API /api/bookings/confirm error:", error);
    return NextResponse.json(
      { error: "Internal server error finalizing movie booking." },
      { status: 500 }
    );
  }
}

// Endpoint to retrieve ticket details by bookingId (UUID or BMS ref)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId" }, { status: 400 });
    }

    // Check in-memory registry first
    const cached = global.__mockTicketsRegistry?.get(bookingId);
    if (cached) {
      return NextResponse.json({ ticket: cached }, { status: 200 });
    }

    // Check unified booking store
    const inStore = getBookingStore().find((b) => b.id === bookingId || b.refId === bookingId);
    if (inStore) {
      const ticket: InMemTicket = {
        bookingId: inStore.id,
        referenceHash: inStore.refId,
        showId: inStore.showId,
        movieTitle: inStore.movieTitle,
        cinemaName: inStore.cinemaName,
        screenName: inStore.screenName,
        date: inStore.showDate,
        time: inStore.showTime,
        seatLabels: inStore.seats,
        userName: inStore.customerName,
        userEmail: inStore.customerEmail,
        userPhone: inStore.customerPhone,
        totalAmount: inStore.totalAmount,
        qrData: JSON.stringify({
          ref: inStore.refId,
          id: inStore.id,
          movie: inStore.movieTitle,
          seats: inStore.seats.join(", "),
        }),
        createdAt: inStore.createdAt,
      };
      return NextResponse.json({ ticket }, { status: 200 });
    }

    // Query Supabase with relations if configured
    if (isSupabaseConfigured()) {
      try {
        let query = supabaseAdmin
          .from("bookings")
          .select(`
            id,
            user_name,
            user_email,
            user_phone,
            total_amount,
            status,
            qr_code_hash,
            created_at,
            shows (
              id,
              date,
              start_time,
              movies (title, poster_url),
              screens (name, screen_tier, cinemas (name, address))
            ),
            booking_seats (
              seats (row_label, seat_number, price)
            )
          `);

      if (isValidUUID(bookingId)) {
        query = query.eq("id", bookingId);
      } else {
        query = query.eq("qr_code_hash", bookingId);
      }

      const { data: dbBooking } = await query.maybeSingle();

      if (dbBooking) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sShow: any = dbBooking.shows;
        const sMovie = sShow?.movies;
        const sScreen = sShow?.screens;
        const sCinema = sScreen?.cinemas;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sSeats: any[] = dbBooking.booking_seats || [];

        const ticket: InMemTicket = {
          bookingId: dbBooking.id,
          referenceHash: dbBooking.qr_code_hash || `BMS-${dbBooking.id.substring(0, 8)}`,
          showId: sShow?.id || "show",
          movieTitle: sMovie?.title || "Movie",
          cinemaName: sCinema?.name || "Cinema",
          screenName: sScreen?.name || "Screen",
          date: sShow?.date || new Date().toISOString().split("T")[0],
          time: sShow?.start_time?.slice(0, 5) || "07:30 PM",
          seatLabels: sSeats.map((bs) => `${bs.seats?.row_label}${bs.seats?.seat_number}`),
          userName: dbBooking.user_name,
          userEmail: dbBooking.user_email,
          userPhone: dbBooking.user_phone,
          totalAmount: Number(dbBooking.total_amount),
          qrData: JSON.stringify({
            ref: dbBooking.qr_code_hash,
            id: dbBooking.id,
            movie: sMovie?.title,
            seats: sSeats.map((bs) => `${bs.seats?.row_label}${bs.seats?.seat_number}`).join(", "),
          }),
          createdAt: dbBooking.created_at,
        };

        return NextResponse.json({ ticket }, { status: 200 });
      }
    } catch (queryErr) {
      console.warn("GET ticket query error:", queryErr);
    }
  }

    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  } catch (err) {
    console.error("GET /api/bookings/confirm error:", err);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}
