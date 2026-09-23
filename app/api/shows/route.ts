import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import {
  getShowsStore,
  addShowToStore,
  getShowById,
  StoredShow,
} from "@/lib/shows-store";
import { MOCK_MOVIES, CITIES } from "@/lib/mock-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const showId = searchParams.get("showId");
    const movieId = searchParams.get("movieId");
    const citySlug = searchParams.get("city") || searchParams.get("citySlug") || "hyderabad";
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Single show lookup
    if (showId) {
      const show = getShowById(showId);
      if (show) {
        return NextResponse.json({ show }, { status: 200 });
      }

      // If Supabase configured, check database
      if (isSupabaseConfigured()) {
        try {
          const { data: dbShow } = await supabaseAdmin
            .from("shows")
            .select(`
              id,
              date,
              start_time,
              end_time,
              movies ( id, title, poster_url ),
              screens (
                id,
                name,
                screen_tier,
                cinemas (
                  id,
                  name,
                  address,
                  cities ( slug, name )
                )
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

            const mapped: StoredShow = {
              id: dbShow.id,
              screenId: sScreen?.id || "screen-1",
              screenName: sScreen?.name || "Audi 1",
              screenTier: sScreen?.screen_tier || "Standard",
              cinemaId: sCinema?.id || "c-1",
              cinemaName: sCinema?.name || "Multiplex",
              cinemaAddress: sCinema?.address || "Address",
              citySlug: sCity?.slug || "hyderabad",
              cityName: sCity?.name || "Hyderabad",
              movieId: sMovie?.id || "m-1",
              movieTitle: sMovie?.title || "Movie",
              date: dbShow.date,
              startTime: dbShow.start_time.slice(0, 5),
              endTime: dbShow.end_time ? dbShow.end_time.slice(0, 5) : "21:00",
              formatBadge: sScreen?.screen_tier === "IMAX" ? "IMAX 3D Laser" : sScreen?.screen_tier === "4DX" ? "4DX" : "Dolby Atmos",
              classicPrice: 220,
              primePrice: 320,
              reclinerPrice: 550,
              createdAt: new Date().toISOString(),
            };

            return NextResponse.json({ show: mapped }, { status: 200 });
          }
        } catch (dbErr) {
          console.warn("Supabase single show query notice:", dbErr);
        }
      }

      return NextResponse.json({ error: "Show not found" }, { status: 404 });
    }

    // If Supabase configured, query live shows from Supabase
    if (isSupabaseConfigured()) {
      try {
        let query = supabaseAdmin
          .from("shows")
          .select(`
            id,
            date,
            start_time,
            end_time,
            movie_id,
            movies ( id, title, poster_url ),
            screens (
              id,
              name,
              screen_tier,
              cinemas (
                id,
                name,
                address,
                cities ( slug, name )
              )
            )
          `)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true });

        if (date) query = query.eq("date", date);
        if (movieId) query = query.eq("movie_id", movieId);

        const { data: dbShows, error: dbErr } = await query;
        if (!dbErr && dbShows && dbShows.length > 0) {
          const mappedShows: StoredShow[] = [];
          for (const s of dbShows) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sMovie: any = s.movies;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const sScreen: any = s.screens;
            const sCinema = sScreen?.cinemas;
            const sCity = sCinema?.cities;

            if (citySlug && sCity?.slug?.toLowerCase() !== citySlug.toLowerCase()) {
              continue;
            }

            const tier = (sScreen?.screen_tier || "Standard") as "IMAX" | "4DX" | "Standard";
            mappedShows.push({
              id: s.id,
              screenId: sScreen?.id || "screen-1",
              screenName: sScreen?.name || "Audi 1",
              screenTier: tier,
              cinemaId: sCinema?.id || "c-1",
              cinemaName: sCinema?.name || "Multiplex",
              cinemaAddress: sCinema?.address || "Address",
              citySlug: sCity?.slug || "mumbai",
              cityName: sCity?.name || "Mumbai",
              movieId: sMovie?.id || s.movie_id,
              movieTitle: sMovie?.title || "Movie",
              date: s.date,
              startTime: s.start_time.slice(0, 5),
              endTime: s.end_time ? s.end_time.slice(0, 5) : "21:00",
              formatBadge: tier === "IMAX" ? "IMAX 3D Laser" : tier === "4DX" ? "4DX Dynamic" : "Dolby Atmos",
              classicPrice: tier === "IMAX" ? 280 : tier === "4DX" ? 260 : 200,
              primePrice: tier === "IMAX" ? 420 : tier === "4DX" ? 380 : 300,
              reclinerPrice: tier === "IMAX" ? 700 : tier === "4DX" ? 650 : 500,
              createdAt: s.date,
            });
          }

          if (mappedShows.length > 0) {
            const cinemaMap = new Map<string, {
              cinemaId: string;
              cinemaName: string;
              address: string;
              shows: {
                showId: string;
                screenName: string;
                screenTier: "IMAX" | "4DX" | "Standard";
                formatBadge: string;
                time: string;
                date: string;
                price: number;
                urgency: "available" | "filling_fast";
              }[];
            }>();

            mappedShows.forEach((s) => {
              if (!cinemaMap.has(s.cinemaId)) {
                cinemaMap.set(s.cinemaId, {
                  cinemaId: s.cinemaId,
                  cinemaName: s.cinemaName,
                  address: s.cinemaAddress,
                  shows: [],
                });
              }

              cinemaMap.get(s.cinemaId)!.shows.push({
                showId: s.id,
                screenName: s.screenName,
                screenTier: s.screenTier,
                formatBadge: s.formatBadge,
                time: s.startTime,
                date: s.date,
                price: s.primePrice,
                urgency: "available",
              });
            });

            return NextResponse.json({
              groups: Array.from(cinemaMap.values()),
              shows: mappedShows,
              totalShows: mappedShows.length,
            }, { status: 200 });
          }
        }
      } catch (err) {
        console.warn("Supabase show list query failed, falling back to in-memory:", err);
      }
    }

    // List & Grouping by Cinema (fallback to in-memory store)
    const allStoreShows = getShowsStore();

    // Filter shows
    const filteredShows = allStoreShows.filter((s) => {
      if (movieId && s.movieId !== movieId) return false;
      if (citySlug && s.citySlug.toLowerCase() !== citySlug.toLowerCase()) return false;
      if (date && s.date !== date) return false;
      return true;
    });

    // Group into CinemaShowGroup structure
    const cinemaMap = new Map<string, {
      cinemaId: string;
      cinemaName: string;
      address: string;
      shows: {
        showId: string;
        screenName: string;
        screenTier: "IMAX" | "4DX" | "Standard";
        formatBadge: string;
        time: string;
        date: string;
        price: number;
        urgency: "available" | "filling_fast";
      }[];
    }>();

    filteredShows.forEach((s) => {
      if (!cinemaMap.has(s.cinemaId)) {
        cinemaMap.set(s.cinemaId, {
          cinemaId: s.cinemaId,
          cinemaName: s.cinemaName,
          address: s.cinemaAddress,
          shows: [],
        });
      }

      cinemaMap.get(s.cinemaId)!.shows.push({
        showId: s.id,
        screenName: s.screenName,
        screenTier: s.screenTier,
        formatBadge: s.formatBadge,
        time: s.startTime,
        date: s.date,
        price: s.primePrice,
        urgency: Math.random() > 0.4 ? "available" : "filling_fast",
      });
    });

    const groups = Array.from(cinemaMap.values());

    return NextResponse.json({
      groups,
      shows: filteredShows,
      totalShows: filteredShows.length,
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/shows error:", err);
    return NextResponse.json({ groups: [], shows: [], totalShows: 0 }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      movieId,
      movieTitle: customMovieTitle,
      cityId,
      cityName: customCityName,
      citySlug: customCitySlug,
      cinemaId,
      cinemaName: customCinemaName,
      cinemaAddress = "Multiplex Center",
      screenId,
      screenName = "Audi 1",
      screenTier = "Standard",
      date,
      startTime,
      endTime,
      classicPrice = 220,
      primePrice = 320,
      reclinerPrice = 550,
    } = body;

    if (!movieId || !screenId || !date || !startTime) {
      return NextResponse.json(
        { error: "Missing required fields (movieId, screenId, date, startTime)" },
        { status: 400 }
      );
    }

    const matchedMovie = MOCK_MOVIES.find((m) => m.id === movieId);
    const movieTitle = customMovieTitle || matchedMovie?.title || "Feature Presentation";

    const matchedCity = CITIES.find((c) => c.id === cityId || c.slug === customCitySlug);
    const cityName = customCityName || matchedCity?.name || "Hyderabad";
    const citySlug = customCitySlug || matchedCity?.slug || "hyderabad";
    const cinemaName = customCinemaName || "Prasads Multiplex";

    const newShowId = `show-pub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    // 1. If Supabase configured, attempt insert
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin.from("shows").insert({
          screen_id: screenId,
          movie_id: movieId,
          date,
          start_time: startTime.includes(":") && startTime.length <= 5 ? `${startTime}:00` : startTime,
          end_time: endTime ? (endTime.length <= 5 ? `${endTime}:00` : endTime) : "22:00:00",
        });
      } catch (dbErr) {
        console.warn("Supabase show insert notice:", dbErr);
      }
    }

    // 2. Add to global unified shows store
    const formatBadge = screenTier === "IMAX" ? "IMAX 3D Laser" : screenTier === "4DX" ? "4DX Motion" : "Dolby Atmos";

    const storedShow: StoredShow = {
      id: newShowId,
      screenId,
      screenName,
      screenTier,
      cinemaId: cinemaId || "c-1",
      cinemaName,
      cinemaAddress,
      citySlug,
      cityName,
      movieId,
      movieTitle,
      date,
      startTime,
      endTime: endTime || "22:00",
      formatBadge,
      classicPrice: Number(classicPrice),
      primePrice: Number(primePrice),
      reclinerPrice: Number(reclinerPrice),
      createdAt: new Date().toISOString(),
    };

    addShowToStore(storedShow);

    return NextResponse.json(
      {
        success: true,
        show: storedShow,
        message: `Showtime for "${movieTitle}" successfully published and live on storefront!`,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/shows error:", err);
    return NextResponse.json({ error: "Failed to schedule showtime" }, { status: 500 });
  }
}
