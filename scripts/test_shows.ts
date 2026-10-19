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

async function test() {
  // Test 1: Count total shows in Supabase
  const { count, error: cErr } = await supabase.from("shows").select("*", { count: "exact", head: true });
  console.log("Total shows count in Supabase:", count, cErr);

  // Test 2: Check distinct dates of shows in Supabase
  const { data: dateShows } = await supabase.from("shows").select("date").limit(500);
  const distinctDates = Array.from(new Set(dateShows?.map(s => s.date)));
  console.log("Distinct dates in Supabase shows:", distinctDates);

  // Test 3: Check K.G.F Chapter 1 movie in Supabase
  const { data: kgf } = await supabase.from("movies").select("id, title").ilike("title", "%K.G.F%").limit(5);
  console.log("KGF movies in Supabase:", kgf);

  if (kgf && kgf.length > 0) {
    const kgfId = kgf[0].id;
    // Check shows for KGF in Supabase
    const { data: kgfShows } = await supabase.from("shows").select(`
      id, date, start_time, movie_id,
      screens!inner (
        id, name,
        cinemas!inner (
          id, name,
          cities!inner ( id, slug, name )
        )
      )
    `).eq("movie_id", kgfId);
    console.log(`Shows for ${kgf[0].title} in Supabase:`, kgfShows?.length, kgfShows?.slice(0, 3));
  }
}

test().catch(console.error);
