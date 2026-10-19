import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envFiles = [".env.local", ".env"];
  const env: Record<string, string> = {};

  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      content.split("\n").forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let val = match[2].trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!env[key]) env[key] = val;
        }
      });
    }
  }

  return env;
}

const env = loadEnv();
const supabase = createClient(env["NEXT_PUBLIC_SUPABASE_URL"], env["SUPABASE_SERVICE_ROLE_KEY"]);

async function testMockBookingLifecycle() {
  console.log("=== TEST MOCK SHOWID LIFECYCLE ===");
  // User wants to book K.G.F: Chapter 1 for Hyderabad, but date is 2026-10-21 (future date)
  const movieTitle = "K.G.F: Chapter 1";
  const citySlug = "hyderabad";
  const mockShowId = `c-11-s1-2026-10-21`;
  const cinemaName = "Prasads Multiplex";
  const screenName = "Screen 6 - Giant Format IMAX";
  const date = "2026-10-21";
  const time = "10:00 AM";

  // Simulate exact logic in /api/bookings/confirm POST (lines 142-268 of route.ts)
  let finalMovieTitle = movieTitle;
  let finalCinemaName = cinemaName;
  let finalScreenName = screenName;
  let finalDate = date;
  let finalTime = time;
  let targetShowId = mockShowId;

  const targetCity = citySlug.toLowerCase();
  const cleanedTitle = finalMovieTitle.replace(/[:(-].*$/, "").trim();
  let movieDbId: string | null = null;

  // 1. Find matching movie in Supabase
  const { data: matchedDbMovie } = await supabase
    .from("movies")
    .select("id, title, poster_url, backdrop_url, description")
    .or(`title.ilike.%${finalMovieTitle}%,title.ilike.%${cleanedTitle}%`)
    .limit(1)
    .maybeSingle();

  console.log("1. Matched DB Movie:", matchedDbMovie);
  if (matchedDbMovie) {
    movieDbId = matchedDbMovie.id;
    finalMovieTitle = matchedDbMovie.title;
  }

  // 2. Find a show specifically for this movie
  let matchedShowId: string | null = null;
  if (movieDbId) {
    const { data: movieShowInCity } = await supabase
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

    console.log("2. movieShowInCity:", movieShowInCity);
    if (movieShowInCity?.id) {
      matchedShowId = movieShowInCity.id;
    } else {
      const { data: anyMovieShow } = await supabase
        .from("shows")
        .select("id, date, start_time")
        .eq("movie_id", movieDbId)
        .limit(1)
        .maybeSingle();
      console.log("2b. anyMovieShow:", anyMovieShow);
      if (anyMovieShow?.id) {
        matchedShowId = anyMovieShow.id;
      }
    }
  }

  console.log("3. Provisioning check: matchedShowId is:", matchedShowId);
  if (!matchedShowId) {
    const { data: targetScreen } = await supabase
      .from("screens")
      .select("id, name, cinemas!inner(name, cities!inner(name, slug))")
      .eq("cinemas.cities.slug", targetCity)
      .limit(1)
      .maybeSingle();

    console.log("Target Screen for provisioning:", targetScreen);
    if (targetScreen?.id && movieDbId) {
      console.log("Would provision show for screen:", targetScreen.id, "and movie:", movieDbId);
      const { data: provShow, error: provErr } = await supabase.from("shows").insert({
        screen_id: targetScreen.id,
        movie_id: movieDbId,
        date: finalDate,
        start_time: "10:00:00",
        end_time: "13:00:00",
      }).select("id").maybeSingle();
      console.log("Provisioned Show:", provShow, provErr);
      if (provShow?.id) {
        matchedShowId = provShow.id;
      }
    }
  }

  if (matchedShowId) {
    targetShowId = matchedShowId;
  } else {
    console.log("FALLBACK! Picking random show from database!");
    const { data: anyShow } = await supabase.from("shows").select("id").limit(1).maybeSingle();
    if (anyShow?.id) targetShowId = anyShow.id;
  }

  console.log("FINAL targetShowId to be inserted into bookings table:", targetShowId);

  // Now let's see what happens if targetShowId was provisioned or matched
  const bookingRef = `BMS-TEST-${Date.now().toString().slice(-6)}`;
  const { data: createdBooking } = await supabase.from("bookings").insert({
    user_name: "Mock Test Bot",
    user_email: "mocktest@test.local",
    user_phone: "+91 99999 77777",
    show_id: targetShowId,
    total_amount: 450,
    booking_ref: bookingRef,
    qr_code_hash: bookingRef,
    status: "CONFIRMED",
  }).select("id").single();

  console.log("Created test booking:", createdBooking);

  if (createdBooking) {
    const { data: tb } = await supabase.from("bookings").select(`
      *,
      shows (
        id, date, start_time,
        movies ( id, title ),
        screens ( name, cinemas ( name, cities ( name ) ) )
      )
    `).eq("id", createdBooking.id).single();

    console.log("Ticket result:", {
      bookingRef,
      movieTitle: (tb?.shows as any)?.movies?.title,
      cinema: (tb?.shows as any)?.screens?.cinemas?.name,
      city: (tb?.shows as any)?.screens?.cinemas?.cities?.name,
    });

    // Clean up
    await supabase.from("bookings").delete().eq("id", createdBooking.id);
    console.log("Cleaned up test booking.");
  }
}

testMockBookingLifecycle().catch(console.error);
