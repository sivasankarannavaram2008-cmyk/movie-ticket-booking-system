import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import {
  StoredShow,
  addShowToStore,
  deleteShowFromStore,
  findShowConflictInStore,
  parseTimeToMinutes,
  formatMinutesTo12Hour,
  formatMinutesTo24Hour,
} from "@/lib/shows-store";
import { MOCK_MOVIES } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * POST /api/shows/schedule
 * Schedules a new showtime with strict collision-prevention validation.
 * Computes: end_time = start_time + duration + 20 minutes turnover buffer.
 * Overlap check: (existing_start < new_end) AND (existing_end > new_start).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      movieId,
      screenId,
      startTime,
      date,
      tierPricing,
      cinemaId,
      cinemaName,
      cinemaAddress,
      screenName,
      screenTier,
      citySlug,
      cityName,
      formatBadge,
    } = body;

    if (!movieId || !screenId || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields: movieId, screenId, and startTime are required." },
        { status: 400 }
      );
    }

    const targetDate = date || new Date().toISOString().split("T")[0];

    // 1. Retrieve Movie Duration
    let movieTitle = body.movieTitle;
    let durationMin = 150;

    const catalogMovie = MOCK_MOVIES.find((m) => m.id === movieId || m.title === movieTitle);
    if (catalogMovie) {
      movieTitle = catalogMovie.title;
      durationMin = catalogMovie.duration_min;
    } else if (isSupabaseConfigured()) {
      try {
        const { data: dbMovie } = await supabaseAdmin
          .from("movies")
          .select("title, duration_min")
          .eq("id", movieId)
          .maybeSingle();
        if (dbMovie) {
          movieTitle = dbMovie.title;
          durationMin = dbMovie.duration_min;
        }
      } catch (dbErr) {
        console.warn("Notice checking DB movie:", dbErr);
      }
    }

    movieTitle = movieTitle || "Feature Film";

    // 2. Dynamic Slot Calculation with 20m Turnaround Buffer
    // end_time = start_time + duration + 20 minutes
    const startMinutes = parseTimeToMinutes(startTime);
    const TURNOVER_BUFFER = 20;
    const endMinutes = startMinutes + durationMin + TURNOVER_BUFFER;

    const startTime24 = formatMinutesTo24Hour(startMinutes);
    const endTime24 = formatMinutesTo24Hour(endMinutes);
    const startTime12 = formatMinutesTo12Hour(startMinutes);
    const endTime12 = formatMinutesTo12Hour(endMinutes);

    // 3. Database & Store Conflict Detection Logic
    // Query condition: (start_time < new_end_time) AND (end_time > new_start_time)
    let conflictFound: { movieTitle: string; startTime: string; endTime: string } | null = null;

    // A. Check Supabase 'shows' table if live database is configured
    if (isSupabaseConfigured()) {
      try {
        const { data: existingDbShows } = await supabaseAdmin
          .from("shows")
          .select(`
            id,
            date,
            start_time,
            end_time,
            movies ( title )
          `)
          .eq("screen_id", screenId)
          .eq("date", targetDate);

        if (existingDbShows && existingDbShows.length > 0) {
          for (const show of existingDbShows) {
            const exStart = parseTimeToMinutes(show.start_time);
            let exEnd = parseTimeToMinutes(show.end_time);
            if (exEnd <= exStart) exEnd += 24 * 60; // Overnight show handling

            let checkEnd = endMinutes;
            if (checkEnd <= startMinutes) checkEnd += 24 * 60;

            if (exStart < checkEnd && exEnd > startMinutes) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const m: any = show.movies;
              conflictFound = {
                movieTitle: m?.title || "Scheduled Film",
                startTime: formatMinutesTo12Hour(exStart),
                endTime: formatMinutesTo12Hour(exEnd),
              };
              break;
            }
          }
        }
      } catch (err) {
        console.warn("Supabase conflict check notice:", err);
      }
    }

    // B. Check in-memory store
    if (!conflictFound) {
      const storeConflict = findShowConflictInStore(screenId, targetDate, startMinutes, endMinutes);
      if (storeConflict) {
        conflictFound = {
          movieTitle: storeConflict.movieTitle,
          startTime: storeConflict.startTime,
          endTime: storeConflict.endTime,
        };
      }
    }

    // 4. If conflict exists, abort and return HTTP 409 Conflict
    if (conflictFound) {
      return NextResponse.json(
        {
          error: `Conflict detected: ${conflictFound.movieTitle} is already scheduled on this screen from ${conflictFound.startTime} to ${conflictFound.endTime}.`,
          conflictShow: conflictFound,
          proposedSlot: {
            start: startTime12,
            end: endTime12,
            duration: durationMin,
            bufferMinutes: TURNOVER_BUFFER,
          },
        },
        { status: 409 }
      );
    }

    // 5. No Conflict: Insert into Supabase shows table & Store
    let createdShowId = `show-sch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    if (isSupabaseConfigured()) {
      try {
        const { data: dbInsert, error: insertError } = await supabaseAdmin
          .from("shows")
          .insert({
            screen_id: screenId,
            movie_id: movieId,
            date: targetDate,
            start_time: `${startTime24}:00`,
            end_time: `${endTime24}:00`,
          })
          .select("id")
          .single();

        if (!insertError && dbInsert) {
          createdShowId = dbInsert.id;
        }
      } catch (insertErr) {
        console.warn("Supabase show insert notice:", insertErr);
      }
    }

    const classicPrice = Number(tierPricing?.classic) || 250;
    const primePrice = Number(tierPricing?.prime) || 380;
    const reclinerPrice = Number(tierPricing?.recliner) || 550;

    const newShowRecord: StoredShow = {
      id: createdShowId,
      screenId,
      screenName: screenName || "Audi 1",
      screenTier: screenTier || "Standard",
      cinemaId: cinemaId || "c-1",
      cinemaName: cinemaName || "Multiplex Cinema",
      cinemaAddress: cinemaAddress || "Metropolitan Entertainment Hub",
      citySlug: citySlug || "hyderabad",
      cityName: cityName || "Hyderabad",
      movieId,
      movieTitle,
      date: targetDate,
      startTime: startTime12,
      endTime: endTime12,
      formatBadge: formatBadge || (screenTier === "IMAX" ? "IMAX 3D Laser" : screenTier === "4DX" ? "4DX" : "Dolby Atmos"),
      classicPrice,
      primePrice,
      reclinerPrice,
      createdAt: new Date().toISOString(),
    };

    addShowToStore(newShowRecord);

    return NextResponse.json(
      {
        message: "Showtime published successfully",
        show: newShowRecord,
        slotPreview: `Scheduled Slot: ${startTime12} – ${endTime12} (Includes ${TURNOVER_BUFFER}m turnover buffer)`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Scheduling error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to schedule showtime" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/shows/schedule
 * Safely removes an empty upcoming show with 0 bookings.
 * If active bookings exist, returns HTTP 409 Conflict: "Cannot unschedule: Active bookings exist."
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let showId = searchParams.get("showId");

    if (!showId) {
      try {
        const body = await req.json();
        showId = body.showId;
      } catch {
        // No body passed
      }
    }

    if (!showId) {
      return NextResponse.json({ error: "showId query or body parameter is required" }, { status: 400 });
    }

    // 1. Guard against accidental deletion: Check for active bookings
    if (isSupabaseConfigured()) {
      try {
        const { data: bookings } = await supabaseAdmin
          .from("bookings")
          .select("id, status, booking_seats(id)")
          .eq("show_id", showId)
          .neq("status", "CANCELLED");

        if (bookings && bookings.length > 0) {
          const totalSeats = bookings.reduce(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (sum, b: any) => sum + (b.booking_seats?.length || 1),
            0
          );
          return NextResponse.json(
            {
              error: "Cannot unschedule: Active bookings exist.",
              details: `This showtime has ${bookings.length} active booking(s) representing ${totalSeats} reserved seat(s).`,
            },
            { status: 409 }
          );
        }

        // Safe to delete in database
        await supabaseAdmin.from("shows").delete().eq("id", showId);
      } catch (dbErr) {
        console.warn("Supabase show delete notice:", dbErr);
      }
    }

    // 2. Remove from in-memory store
    const deleted = deleteShowFromStore(showId);

    return NextResponse.json(
      {
        success: true,
        message: "Showtime unscheduled successfully.",
        showId,
        inMemoryDeleted: deleted,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error("Delete show error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to unschedule showtime" },
      { status: 500 }
    );
  }
}
