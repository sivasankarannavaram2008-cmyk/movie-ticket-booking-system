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

async function runBookingTest() {
  console.log("=== STEP 1: Select a Movie from Supabase ===");
  // Let's test with K.G.F: Chapter 1
  const { data: movies } = await supabase.from("movies").select("id, title").ilike("title", "%K.G.F: Chapter 1%").limit(1);
  if (!movies || movies.length === 0) {
    console.error("Movie not found!");
    return;
  }
  const testMovie = movies[0];
  console.log("Test Movie Selected:", testMovie);

  console.log("\n=== STEP 2: Find a Show for this Movie in Hyderabad ===");
  const today = new Date().toISOString().split("T")[0];
  const { data: shows } = await supabase.from("shows").select(`
    id, date, start_time, movie_id,
    screens ( id, name, screen_tier, cinemas ( id, name, cities ( name, slug ) ) )
  `)
  .eq("movie_id", testMovie.id)
  .limit(1);

  console.log("Found Show:", JSON.stringify(shows, null, 2));

  let showIdToUse = shows && shows.length > 0 ? shows[0].id : null;
  let screenId = shows && shows.length > 0 ? (shows[0].screens as any).id : null;

  if (!showIdToUse) {
    console.log("No show found for movie. Simulating mock show ID like frontend does...");
    showIdToUse = `c-11-s1-${today}`;
  }

  // Get seats for this screen if UUID
  let seatIdsToBook = ["seat-A1", "seat-A2"];
  if (screenId) {
    const { data: seats } = await supabase.from("seats").select("id, row_label, seat_number, price").eq("screen_id", screenId).limit(2);
    if (seats && seats.length > 0) {
      seatIdsToBook = seats.map(s => s.id);
    }
  }

  console.log("\n=== STEP 3: Confirm Booking via Internal Confirmation Handler ===");
  // We can test the exact logic inside /api/bookings/confirm POST
  const bookingRef = `BMS-TEST-${Date.now().toString().slice(-6)}`;
  const userName = "Verification Bot";
  const userEmail = "verify@test.local";
  const userPhone = "+91 99999 88888";
  const totalAmount = 560;

  console.log("Submitting payload with:", {
    showId: showIdToUse,
    movieTitle: testMovie.title,
    bookingRef,
  });

  // Let's see what happens if targetShowId is not a UUID vs is a UUID
  let targetShowId = showIdToUse;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetShowId)) {
    console.log("WARNING: showId is not a UUID:", targetShowId);
  }

  const { data: createdBooking, error: insErr } = await supabase.from("bookings").insert({
    user_name: userName,
    user_email: userEmail,
    user_phone: userPhone,
    show_id: targetShowId,
    total_amount: totalAmount,
    booking_ref: bookingRef,
    qr_code_hash: bookingRef,
    status: "CONFIRMED",
  }).select("id").single();

  console.log("Insert Result:", createdBooking, insErr);

  if (createdBooking) {
    console.log("\n=== STEP 4: Query Ticket Back Exactly as Ticket Page Does ===");
    const { data: ticketBooking, error: tErr } = await supabase.from("bookings").select(`
      *,
      shows (
        id, date, start_time,
        movies ( id, title, poster_url ),
        screens ( name, cinemas ( name, cities ( name ) ) )
      )
    `).eq("id", createdBooking.id).single();

    console.log("Retrieved Ticket from DB:", JSON.stringify(ticketBooking, null, 2), tErr);
    
    const retrievedTitle = (ticketBooking?.shows as any)?.movies?.title;
    console.log(`\nOriginal Movie: "${testMovie.title}"`);
    console.log(`Ticket Title:   "${retrievedTitle}"`);
    if (retrievedTitle === testMovie.title) {
      console.log("SUCCESS: Movie title matches correctly!");
    } else {
      console.error(`MISMATCH ERROR! Expected "${testMovie.title}", but got "${retrievedTitle}"!`);
    }

    console.log("\n=== STEP 5: Clean Up Only Verification Booking Data ===");
    await supabase.from("booking_seats").delete().eq("booking_id", createdBooking.id);
    await supabase.from("bookings").delete().eq("id", createdBooking.id);
    console.log("Cleaned up verification test booking ID:", createdBooking.id);
  }
}

runBookingTest().catch(console.error);
