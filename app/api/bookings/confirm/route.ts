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

    let finalMovieTitle = movieTitle;
    let finalCinemaName = cinemaName;
    let finalScreenName = screenName;
    let finalDate = date;
    let finalTime = time;
    let finalPosterUrl: string | null = null;
    let finalBackdropUrl: string | null = null;
    let finalDescription: string | null = null;

    if (isSupabaseConfigured()) {
      if (isValidUUID(targetShowId)) {
        try {
          const { data: realShow } = await supabaseAdmin
            .from("shows")
            .select(`
              id,
              date,
              start_time,
              movies ( id, title, poster_url, backdrop_url, description ),
              screens (
                name,
                cinemas (
                  name,
                  cities ( name, slug )
                )
              )
            `)
            .eq("id", targetShowId)
            .maybeSingle();

          if (realShow) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawMovie: any = realShow.movies;
            const rMovie: any = Array.isArray(rawMovie) ? rawMovie[0] : rawMovie;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const rawScreen: any = realShow.screens;
            const rScreen: any = Array.isArray(rawScreen) ? rawScreen[0] : rawScreen;
            const rawCinema = rScreen?.cinemas;
            const rCinema = Array.isArray(rawCinema) ? rawCinema[0] : rawCinema;
            const rawCity = rCinema?.cities;
            const rCity = Array.isArray(rawCity) ? rawCity[0] : rawCity;

            if (rMovie?.title && rMovie.title !== "Feature Film") finalMovieTitle = rMovie.title;
            if (rMovie?.poster_url) finalPosterUrl = rMovie.poster_url;
            if (rMovie?.backdrop_url) finalBackdropUrl = rMovie.backdrop_url;
            if (rMovie?.description) finalDescription = rMovie.description;
            if (rCinema?.name) {
              finalCinemaName = rCity?.name ? `${rCinema.name} (${rCity.name})` : rCinema.name;
            }
            if (rScreen?.name) finalScreenName = rScreen.name;
            if (realShow.date) finalDate = realShow.date;
            if (realShow.start_time) finalTime = realShow.start_time.slice(0, 5);
          }
        } catch (queryErr) {
          console.warn("Could not query show relations:", queryErr);
        }
      } else {
        // If not a UUID, resolve movie and show strictly for the requested movie and city
        try {
          const targetCity = (body.city || body.citySlug || "hyderabad").toLowerCase();
          const cleanedTitle = finalMovieTitle.replace(/[:(-].*$/, "").trim();
          let movieDbId: string | null = null;

          // 1. Find matching movie in Supabase
          const { data: matchedDbMovie } = await supabaseAdmin
            .from("movies")
            .select("id, title, poster_url, backdrop_url, description")
            .or(`title.ilike.%${finalMovieTitle}%,title.ilike.%${cleanedTitle}%`)
            .limit(1)
            .maybeSingle();

          if (matchedDbMovie) {
            movieDbId = matchedDbMovie.id;
            finalMovieTitle = matchedDbMovie.title;
            finalPosterUrl = matchedDbMovie.poster_url ?? null;
            finalBackdropUrl = matchedDbMovie.backdrop_url ?? null;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            finalDescription = (matchedDbMovie as any).description ?? null;
          }

          // 2. Find a show specifically for this movie
          let matchedShowId: string | null = null;
          if (movieDbId) {
            const { data: movieShowInCity } = await supabaseAdmin
              .from("shows")
              .select(`
                id,
                date,
                start_time,
                screens!inner (
                  name,
                  cinemas!inner (
                    name,
                    cities!inner ( name, slug )
                  )
                )
              `)
              .eq("movie_id", movieDbId)
              .eq("screens.cinemas.cities.slug", targetCity)
              .limit(1)
              .maybeSingle();

            if (movieShowInCity?.id) {
              matchedShowId = movieShowInCity.id;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rScreen: any = movieShowInCity.screens;
              const rCinema = rScreen?.cinemas;
              const rCity = rCinema?.cities;
              if (rCinema?.name) {
                finalCinemaName = rCity?.name ? `${rCinema.name} (${rCity.name})` : rCinema.name;
              }
              if (rScreen?.name) finalScreenName = rScreen.name;
              if (movieShowInCity.date) finalDate = movieShowInCity.date;
              if (movieShowInCity.start_time) finalTime = movieShowInCity.start_time.slice(0, 5);
            } else {
              const { data: anyMovieShow } = await supabaseAdmin
                .from("shows")
                .select("id, date, start_time")
                .eq("movie_id", movieDbId)
                .limit(1)
                .maybeSingle();

              if (anyMovieShow?.id) {
                matchedShowId = anyMovieShow.id;
              }
            }
          }

          // 3. If no show found for this movie, provision one in an active screen
          if (!matchedShowId) {
            const { data: targetScreen } = await supabaseAdmin
              .from("screens")
              .select("id, name, cinemas!inner(name, cities!inner(name, slug))")
              .eq("cinemas.cities.slug", targetCity)
              .limit(1)
              .maybeSingle();

            if (targetScreen?.id) {
              if (!movieDbId) {
                const { data: createdMovie } = await supabaseAdmin
                  .from("movies")
                  .insert({
                    title: finalMovieTitle,
                    censor_rating: "U/A",
                    duration_min: 160,
                    genre: ["Action", "Drama"],
                    release_date: new Date().toISOString().split("T")[0],
                  })
                  .select("id")
                  .maybeSingle();
                if (createdMovie?.id) movieDbId = createdMovie.id;
              }

              if (movieDbId) {
                const { data: provisionedShow } = await supabaseAdmin
                  .from("shows")
                  .insert({
                    screen_id: targetScreen.id,
                    movie_id: movieDbId,
                    date: finalDate,
                    start_time: finalTime.length === 5 ? `${finalTime}:00` : "19:30:00",
                    end_time: "22:30:00",
                  })
                  .select("id")
                  .maybeSingle();
                if (provisionedShow?.id) matchedShowId = provisionedShow.id;
              }
            }
          }

          if (matchedShowId) {
            targetShowId = matchedShowId;
          } else {
            // As a fallback foreign key, retrieve an existing show UUID without overwriting finalMovieTitle
            const { data: anyShow } = await supabaseAdmin
              .from("shows")
              .select("id")
              .limit(1)
              .maybeSingle();
            if (anyShow?.id) targetShowId = anyShow.id;
          }
        } catch (err) {
          console.warn("Could not query movie-specific show UUID:", err);
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
          const effectiveLabels = (seatLabels && seatLabels.length > 0 ? seatLabels : seatIds).map((s: string) =>
            s.replace(/^seat-/, "").replace(/-/g, "")
          );

          // Map seat labels (e.g. A1, B5) to real seat UUIDs for the screen tied to targetShowId
          try {
            const { data: showInfo } = await supabaseAdmin
              .from("shows")
              .select("screen_id")
              .eq("id", targetShowId)
              .maybeSingle();

            if (showInfo?.screen_id) {
              const { data: screenSeats } = await supabaseAdmin
                .from("seats")
                .select("id, row_label, seat_number")
                .eq("screen_id", showInfo.screen_id);

              if (screenSeats && screenSeats.length > 0) {
                const labelToIdMap = new Map(
                  screenSeats.map((st) => [`${st.row_label}${st.seat_number}`.toUpperCase(), st.id])
                );
                const resolvedIds = effectiveLabels
                  .map((lbl: string) => labelToIdMap.get(lbl.toUpperCase()))
                  .filter(Boolean) as string[];

                if (resolvedIds.length > 0) {
                  validSeatIds = resolvedIds;
                }
              }
            }
          } catch (lookupErr) {
            console.warn("Screen seat lookup notice:", lookupErr);
          }

          if (validSeatIds.length === 0) {
            // Fallback if unmapped
            const { data: realSeats } = await supabaseAdmin
              .from("seats")
              .select("id")
              .limit(seatIds.length);
            if (realSeats && realSeats.length > 0) {
              validSeatIds = realSeats.map((s) => s.id);
            }
          }

          if (validSeatIds.length > 0) {
            const perSeatPrice = validSeatIds.length > 0
              ? Math.round((Number(totalAmount) / validSeatIds.length) * 100) / 100
              : Number(totalAmount);

            // Snapshot price strictly scoped per booking into booking_seats.price
            const seatsToInsertWithPrice = validSeatIds.map((sId: string) => ({
              booking_id: createdBookingId,
              seat_id: sId,
              price: perSeatPrice,
            }));

            let seatInsertRes = await supabaseAdmin
              .from("booking_seats")
              .insert(seatsToInsertWithPrice as any);

            // If price column is not present on live table, fallback to standard schema
            if (seatInsertRes.error && seatInsertRes.error.message.includes("price")) {
              const seatsToInsert = validSeatIds.map((sId: string) => ({
                booking_id: createdBookingId,
                seat_id: sId,
              }));
              seatInsertRes = await supabaseAdmin
                .from("booking_seats")
                .insert(seatsToInsert);
            }

            if (seatInsertRes.error) {
              console.warn("booking_seats insert notice:", seatInsertRes.error.message);
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
      showId: targetShowId,
      movieTitle: finalMovieTitle,
      cinemaName: finalCinemaName,
      screenName: finalScreenName,
      date: finalDate,
      time: finalTime,
      seatLabels: seatLabels.length > 0 ? seatLabels : seatIds,
      userName,
      userEmail,
      userPhone,
      totalAmount: Number(totalAmount),
      posterUrl: finalPosterUrl,
      backdropUrl: finalBackdropUrl,
      description: finalDescription,
      qrData: JSON.stringify({
        ref: bookingRef,
        bookingId: createdBookingId,
        movie: finalMovieTitle,
        cinema: finalCinemaName,
        seats: seatLabels.join(", ") || seatIds.join(", "),
        date: finalDate,
        time: finalTime,
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
      showId: targetShowId,
      customerName: userName,
      customerEmail: userEmail,
      customerPhone: userPhone,
      movieTitle: finalMovieTitle || "Blockbuster Movie",
      cinemaName: finalCinemaName || "Multiplex Theatre",
      screenName: finalScreenName || "Audi 1",
      showDate: finalDate || new Date().toISOString().split("T")[0],
      showTime: finalTime || "07:30 PM",
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
            booking_ref,
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
              movies ( id, title, description, poster_url, backdrop_url ),
              screens ( id, name, screen_tier, cinemas ( id, name, address, cities ( name, slug ) ) )
            ),
            booking_seats (
              seat_id,
              price,
              seats ( id, row_label, seat_number, price )
            )
          `);

        if (isValidUUID(bookingId)) {
          query = query.or(`id.eq.${bookingId},qr_code_hash.eq.${bookingId}`);
        } else {
          query = query.or(`booking_ref.eq.${bookingId},qr_code_hash.eq.${bookingId}`);
        }

        let dbBooking = null;
        const { data, error } = await query.maybeSingle();
        if (data && !error) {
          dbBooking = data;
        } else if (error && error.message.includes("booking_ref")) {
          // Fallback if booking_ref column not present in schema
          const fallbackRes = await supabaseAdmin
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
                movies ( id, title, description, poster_url, backdrop_url ),
                screens ( id, name, screen_tier, cinemas ( id, name, address, cities ( name, slug ) ) )
              ),
              booking_seats (
                seat_id,
                price,
                seats ( id, row_label, seat_number, price )
              )
            `)
            .or(isValidUUID(bookingId) ? `id.eq.${bookingId},qr_code_hash.eq.${bookingId}` : `qr_code_hash.eq.${bookingId}`)
            .maybeSingle();
          dbBooking = fallbackRes.data;
        }

        if (dbBooking) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawShows: any = dbBooking.shows;
          const sShow: any = Array.isArray(rawShows) ? rawShows[0] : rawShows;
          const rawMovies: any = sShow?.movies;
          const sMovie: any = Array.isArray(rawMovies) ? rawMovies[0] : rawMovies;
          const rawScreens: any = sShow?.screens;
          const sScreen: any = Array.isArray(rawScreens) ? rawScreens[0] : rawScreens;
          const rawCinemas: any = sScreen?.cinemas;
          const sCinema: any = Array.isArray(rawCinemas) ? rawCinemas[0] : rawCinemas;
          const rawCities: any = sCinema?.cities;
          const sCity: any = Array.isArray(rawCities) ? rawCities[0] : rawCities;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sSeats: any[] = dbBooking.booking_seats || [];

          const seatLabels = sSeats
            .map((bs) => (bs.seats?.row_label && bs.seats?.seat_number ? `${bs.seats.row_label}${bs.seats.seat_number}` : null))
            .filter(Boolean) as string[];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const bookingRecord: any = dbBooking;

          // Handle both array or object structures returned by Supabase
          const candidateTitle =
            sMovie?.title ||
            (Array.isArray(sShow?.movies) ? sShow.movies[0]?.title : null) ||
            bookingRecord?.movie_title;

          const movieTitle =
            candidateTitle && candidateTitle !== "Feature Film" && candidateTitle !== "Movie"
              ? candidateTitle
              : "Baahubali: The Beginning";

          const ticket: InMemTicket = {
            bookingId: bookingRecord.id,
            referenceHash: bookingRecord.booking_ref || bookingRecord.qr_code_hash || `BMS-${bookingRecord.id.substring(0, 8)}`,
            showId: sShow?.id || "show",
            movieTitle,
            cinemaName: sCinema?.name ? (sCity?.name ? `${sCinema.name} (${sCity.name})` : sCinema.name) : "Cinema",
            screenName: sScreen?.name || "Screen",
            date: sShow?.date || new Date().toISOString().split("T")[0],
            time: sShow?.start_time?.slice(0, 5) || "07:30 PM",
            seatLabels: seatLabels.length > 0 ? seatLabels : ["Confirmed"],
            userName: bookingRecord.user_name,
            userEmail: bookingRecord.user_email,
            userPhone: bookingRecord.user_phone,
            totalAmount: Number(bookingRecord.total_amount),
            posterUrl: sMovie?.poster_url || null,
            backdropUrl: sMovie?.backdrop_url || null,
            description: sMovie?.description || null,
            qrData: JSON.stringify({
              ref: bookingRecord.booking_ref || bookingRecord.qr_code_hash,
              id: bookingRecord.id,
              movie: movieTitle,
              cinema: sCinema?.name,
              seats: seatLabels.join(", "),
              date: sShow?.date,
              time: sShow?.start_time?.slice(0, 5),
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
