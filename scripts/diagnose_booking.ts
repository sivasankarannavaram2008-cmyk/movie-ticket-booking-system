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
const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseServiceRoleKey = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  console.log("Connected to Supabase:", supabaseUrl);
  
  // 1. Check movies count and sample
  const { data: movies, error: mErr } = await supabase.from("movies").select("id, title, poster_url").limit(5);
  console.log("Sample Movies:", movies, mErr);

  // 2. Check shows count and sample join
  const { data: shows, error: sErr } = await supabase.from("shows").select(`
    id, date, start_time, movie_id,
    movies ( id, title ),
    screens ( id, name, cinemas ( id, name, cities ( id, name, slug ) ) )
  `).limit(5);
  console.log("Sample Shows:", JSON.stringify(shows, null, 2), sErr);

  // 3. Check recent bookings in Supabase
  const { data: bookings, error: bErr } = await supabase.from("bookings").select(`
    id, booking_ref, total_amount, show_id, created_at,
    shows (
      id, date, start_time,
      movies ( id, title ),
      screens ( name, cinemas ( name, cities ( name ) ) )
    )
  `).order("created_at", { ascending: false }).limit(5);
  console.log("Recent Bookings:", JSON.stringify(bookings, null, 2), bErr);
}

main().catch(console.error);
