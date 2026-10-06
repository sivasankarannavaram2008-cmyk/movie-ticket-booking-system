import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database, ScreenTier, SeatType } from "../types/database";

// Load environment variables manually from .env.local and .env
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
const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"] || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = env["SUPABASE_SERVICE_ROLE_KEY"] || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Chunking helper to prevent exceeding database payload limits
function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

// Format date YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function seed() {
  console.log("======================================================================");
  console.log("🎬 MTBS - Uniform Multi-City Seeding & Scheduling Workflow");
  console.log("======================================================================\n");

  const isConfigured =
    supabaseUrl &&
    supabaseServiceRoleKey &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseServiceRoleKey.includes("placeholder");

  if (!isConfigured) {
    throw new Error("Supabase credentials not found in .env.local! Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
  }

  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);
  const supabase = createClient<Database>(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: { persistSession: false },
  });

  // --------------------------------------------------------------------------
  // 1. Ensure Every City Exists (including Vellore)
  // --------------------------------------------------------------------------
  console.log("📍 [1/5] Ensuring All Cities Exist in Database...");
  const masterCities = [
    { name: "Mumbai", state: "Maharashtra", slug: "mumbai" },
    { name: "Delhi-NCR", state: "National Capital Region", slug: "delhi-ncr" },
    { name: "Bengaluru", state: "Karnataka", slug: "bengaluru" },
    { name: "Hyderabad", state: "Telangana", slug: "hyderabad" },
    { name: "Chennai", state: "Tamil Nadu", slug: "chennai" },
    { name: "Kolkata", state: "West Bengal", slug: "kolkata" },
    { name: "Pune", state: "Maharashtra", slug: "pune" },
    { name: "Ahmedabad", state: "Gujarat", slug: "ahmedabad" },
    { name: "Vellore", state: "Tamil Nadu", slug: "vellore" },
  ];

  // Upsert master cities
  const { error: cityUpsertErr } = await supabase
    .from("cities")
    .upsert(masterCities, { onConflict: "slug" });
  if (cityUpsertErr) throw new Error(`Failed to upsert cities: ${cityUpsertErr.message}`);

  const { data: dbCities, error: cityFetchErr } = await supabase
    .from("cities")
    .select("id, name, state, slug");
  if (cityFetchErr) throw new Error(`Failed to fetch cities: ${cityFetchErr.message}`);

  console.log(`   ✅ Verified ${dbCities.length} active cities in database:`);
  dbCities.forEach((c) => console.log(`      - ${c.name} (${c.slug})`));

  // --------------------------------------------------------------------------
  // 2. Cinema & Screen Infrastructure Configuration
  // --------------------------------------------------------------------------
  console.log("\n🏢 [2/5] Configuring Multiplex Chains & Screens for Every City...");

  const cinemasConfig: Record<
    string,
    { name: string; address: string; screens: { name: string; screen_tier: ScreenTier }[] }[]
  > = {
    mumbai: [
      {
        name: "PVR INOX Palladium",
        address: "High Street Phoenix, Senapati Bapat Marg, Lower Parel",
        screens: [
          { name: "Audi 1 - Laser IMAX", screen_tier: "IMAX" },
          { name: "Audi 2 - 4DX Dynamic", screen_tier: "4DX" },
          { name: "Audi 3 - Dolby Atmos Premiere", screen_tier: "Standard" },
          { name: "Audi 4 - ScreenX 270", screen_tier: "Standard" },
        ],
      },
      {
        name: "Cinépolis Grand Mall",
        address: "New Link Road, Veera Desai Industrial Estate, Andheri West",
        screens: [
          { name: "Screen 1 - VIP IMAX", screen_tier: "IMAX" },
          { name: "Screen 2 - Macro XE Atmos", screen_tier: "Standard" },
          { name: "Screen 3 - 4DX Immersive", screen_tier: "4DX" },
        ],
      },
      {
        name: "INOX Megaplex Inorbit",
        address: "Inorbit Mall, Link Road, Malad West",
        screens: [
          { name: "Screen 1 - IMAX with Laser", screen_tier: "IMAX" },
          { name: "Screen 2 - ScreenX Panoramic", screen_tier: "Standard" },
          { name: "Screen 3 - Dolby Atmos Gold", screen_tier: "Standard" },
        ],
      },
      {
        name: "PVR Maison BKC",
        address: "Jio World Drive, Bandra Kurla Complex",
        screens: [
          { name: "Luxe 1 - Dolby Atmos Luxe", screen_tier: "Standard" },
          { name: "Luxe 2 - 4DX Motion", screen_tier: "4DX" },
          { name: "Luxe 3 - VIP Royale", screen_tier: "Standard" },
        ],
      },
    ],

    "delhi-ncr": [
      {
        name: "PVR Director's Cut Vasant Kunj",
        address: "Ambience Mall, Nelson Mandela Marg, New Delhi",
        screens: [
          { name: "DC 1 - Grand IMAX", screen_tier: "IMAX" },
          { name: "DC 2 - 4DX Thrill Theater", screen_tier: "4DX" },
          { name: "DC 3 - Atmos Supreme", screen_tier: "Standard" },
          { name: "DC 4 - ScreenX Multi-View", screen_tier: "Standard" },
        ],
      },
      {
        name: "INOX Megamall Gurugram",
        address: "Golf Course Road, DLF Phase 1, Sector 28, Gurugram",
        screens: [
          { name: "Screen 1 - Laser IMAX 3D", screen_tier: "IMAX" },
          { name: "Screen 2 - Dolby Atmos Standard", screen_tier: "Standard" },
          { name: "Screen 3 - 4DX Sensory", screen_tier: "4DX" },
        ],
      },
      {
        name: "PVR Superplex Mall of India",
        address: "Sector 18, Noida",
        screens: [
          { name: "Audi 1 - IMAX with Laser", screen_tier: "IMAX" },
          { name: "Audi 2 - 4DX Action", screen_tier: "4DX" },
          { name: "Audi 3 - Dolby Atmos BigPix", screen_tier: "Standard" },
        ],
      },
      {
        name: "Cinépolis DLF Avenue Saket",
        address: "Press Enclave Marg, Saket District Centre, New Delhi",
        screens: [
          { name: "Screen 1 - Macro XE Dolby", screen_tier: "Standard" },
          { name: "Screen 2 - VIP Club Class", screen_tier: "Standard" },
          { name: "Screen 3 - 4DX Immersive", screen_tier: "4DX" },
        ],
      },
    ],

    bengaluru: [
      {
        name: "PVR Superplex Vega City",
        address: "Bannerghatta Main Road, Dollars Colony",
        screens: [
          { name: "Audi 1 - Laser IMAX", screen_tier: "IMAX" },
          { name: "Audi 2 - 4DX Dynamic Experience", screen_tier: "4DX" },
          { name: "Audi 3 - Dolby Atmos Premiere", screen_tier: "Standard" },
          { name: "Audi 4 - ScreenX 270 Panoramic", screen_tier: "Standard" },
        ],
      },
      {
        name: "INOX Forum South Bengaluru",
        address: "Forum South Bengaluru Mall, Kanakapura Road",
        screens: [
          { name: "Screen 1 - BigPix Dolby Atmos", screen_tier: "Standard" },
          { name: "Screen 2 - Laser IMAX", screen_tier: "IMAX" },
          { name: "Screen 3 - 4DX Thrill Theater", screen_tier: "4DX" },
        ],
      },
      {
        name: "Cinépolis Orion Mall",
        address: "Dr. Rajkumar Road, Rajajinagar",
        screens: [
          { name: "Screen 1 - VIP Luxe Screen", screen_tier: "Standard" },
          { name: "Screen 2 - 4DX Action Pro", screen_tier: "4DX" },
          { name: "Screen 3 - Dolby Atmos Master", screen_tier: "Standard" },
        ],
      },
      {
        name: "PVR Phoenix Marketcity Whitefield",
        address: "Whitefield Main Road, Mahadevapura",
        screens: [
          { name: "Screen 1 - IMAX with Laser", screen_tier: "IMAX" },
          { name: "Screen 2 - Dolby 7.1 Classic", screen_tier: "Standard" },
          { name: "Screen 3 - ScreenX Surround", screen_tier: "Standard" },
        ],
      },
    ],

    hyderabad: [
      {
        name: "Prasads Multiplex",
        address: "Prasads IMAX Road, NTR Gardens, Necklace Road",
        screens: [
          { name: "Screen 6 - Giant Format IMAX", screen_tier: "IMAX" },
          { name: "Screen 1 - 4DX Thrill Arena", screen_tier: "4DX" },
          { name: "Screen 2 - Dolby Atmos Supreme", screen_tier: "Standard" },
          { name: "Screen 3 - ScreenX 270", screen_tier: "Standard" },
          { name: "Screen 4 - Laser 4K Digital", screen_tier: "Standard" },
        ],
      },
      {
        name: "AMB Cinemas",
        address: "Sarath City Capital Mall, Gachibowli - Miyapur Road",
        screens: [
          { name: "Screen 1 - Super Screen Dolby Atmos", screen_tier: "Standard" },
          { name: "Screen 2 - Laser IMAX Experience", screen_tier: "IMAX" },
          { name: "Screen 3 - VIP Gold Class", screen_tier: "Standard" },
          { name: "Screen 4 - 4DX Extreme", screen_tier: "4DX" },
        ],
      },
      {
        name: "PVR Next Galleria Panjagutta",
        address: "Next Galleria Mall, Nagarjuna Circle, Panjagutta",
        screens: [
          { name: "Screen 1 - 4DX Sensory", screen_tier: "4DX" },
          { name: "Screen 2 - IMAX with Laser", screen_tier: "IMAX" },
          { name: "Screen 3 - Dolby Atmos Gold", screen_tier: "Standard" },
          { name: "Screen 4 - Luxe Premiere", screen_tier: "Standard" },
        ],
      },
    ],

    chennai: [
      {
        name: "Sathyam Cinemas SPI",
        address: "8, Thiru Vi Ka Road, Peters Colony, Royapettah",
        screens: [
          { name: "Sathyam Main - Dolby Atmos", screen_tier: "Standard" },
          { name: "Santham - Laser IMAX", screen_tier: "IMAX" },
          { name: "Studio 5 - 4DX Motion Theatre", screen_tier: "4DX" },
          { name: "Six Degrees - ScreenX", screen_tier: "Standard" },
        ],
      },
      {
        name: "PVR Grand Galada",
        address: "Grand Galada Centre Mall, GST Road, Pallavaram",
        screens: [
          { name: "Screen 1 - Laser 4K Dolby Atmos", screen_tier: "Standard" },
          { name: "Screen 2 - 4DX Action Pro", screen_tier: "4DX" },
          { name: "Screen 3 - IMAX Experience", screen_tier: "IMAX" },
          { name: "Screen 4 - Classic Cinema", screen_tier: "Standard" },
        ],
      },
      {
        name: "INOX Phoenix Marketcity Velachery",
        address: "Phoenix Marketcity, Indira Gandhi Nagar, Velachery",
        screens: [
          { name: "Insignia 1 - IMAX with Laser", screen_tier: "IMAX" },
          { name: "Insignia 2 - Dolby Atmos Supreme", screen_tier: "Standard" },
          { name: "Screen 3 - ScreenX Surround", screen_tier: "Standard" },
          { name: "Screen 4 - Standard Luxe", screen_tier: "Standard" },
        ],
      },
    ],

    kolkata: [
      {
        name: "INOX Quest Mall",
        address: "33, Syed Amir Ali Avenue, Park Circus",
        screens: [
          { name: "Insignia 1 - Laser IMAX", screen_tier: "IMAX" },
          { name: "Insignia 2 - 4DX Dynamic", screen_tier: "4DX" },
          { name: "Insignia 3 - Dolby Atmos Deluxe", screen_tier: "Standard" },
          { name: "Insignia 4 - ScreenX Multi-View", screen_tier: "Standard" },
        ],
      },
      {
        name: "Cinépolis Acropolis",
        address: "Acropolis Mall, Rajdanga Main Road, Kasba",
        screens: [
          { name: "Screen 1 - 4DX Action", screen_tier: "4DX" },
          { name: "Screen 2 - Standard Dolby Atmos", screen_tier: "Standard" },
          { name: "Screen 3 - IMAX 3D Experience", screen_tier: "IMAX" },
          { name: "Screen 4 - VIP Lounge Class", screen_tier: "Standard" },
        ],
      },
      {
        name: "PVR Mani Square",
        address: "164/1, Maniktala Main Road, Mani Square Mall",
        screens: [
          { name: "Screen 1 - IMAX with Laser", screen_tier: "IMAX" },
          { name: "Screen 2 - Dolby Atmos BigPix", screen_tier: "Standard" },
          { name: "Screen 3 - ScreenX 270", screen_tier: "Standard" },
          { name: "Screen 4 - Premiere Digital", screen_tier: "Standard" },
        ],
      },
    ],

    pune: [
      {
        name: "PVR Phoenix Marketcity Viman Nagar",
        address: "Phoenix Marketcity, Viman Nagar",
        screens: [
          { name: "Audi 1 - Laser IMAX 3D", screen_tier: "IMAX" },
          { name: "Audi 2 - 4DX Thrill Theater", screen_tier: "4DX" },
          { name: "Audi 3 - Dolby Atmos Premiere", screen_tier: "Standard" },
          { name: "Audi 4 - ScreenX Panoramic", screen_tier: "Standard" },
        ],
      },
      {
        name: "Cinépolis Seasons Mall Hadapsar",
        address: "Seasons Mall, Magarpatta City, Hadapsar",
        screens: [
          { name: "Screen 1 - VIP Club Class", screen_tier: "Standard" },
          { name: "Screen 2 - Dolby Atmos Laser", screen_tier: "Standard" },
          { name: "Screen 3 - 4DX Immersive", screen_tier: "4DX" },
          { name: "Screen 4 - IMAX Laser 4K", screen_tier: "IMAX" },
        ],
      },
      {
        name: "INOX Bund Garden",
        address: "Bund Garden Road, Camp, Pune",
        screens: [
          { name: "Screen 1 - IMAX Experience", screen_tier: "IMAX" },
          { name: "Screen 2 - Dolby Atmos Luxe", screen_tier: "Standard" },
          { name: "Screen 3 - ScreenX 270", screen_tier: "Standard" },
          { name: "Screen 4 - Silver Classic", screen_tier: "Standard" },
        ],
      },
    ],

    ahmedabad: [
      {
        name: "PVR Acropolis Thaltej",
        address: "Acropolis Mall, Thaltej Cross Road, SG Highway",
        screens: [
          { name: "Audi 1 - Laser IMAX", screen_tier: "IMAX" },
          { name: "Audi 2 - 4DX Sensory", screen_tier: "4DX" },
          { name: "Audi 3 - Dolby Atmos Gold", screen_tier: "Standard" },
          { name: "Audi 4 - ScreenX Multi-Screen", screen_tier: "Standard" },
        ],
      },
      {
        name: "Cinépolis Nexus Ahmedabad One",
        address: "Nexus Ahmedabad One Mall, Vastrapur",
        screens: [
          { name: "Screen 1 - 4DX Cinema Action", screen_tier: "4DX" },
          { name: "Screen 2 - Standard Dolby Atmos", screen_tier: "Standard" },
          { name: "Screen 3 - Laser IMAX 3D", screen_tier: "IMAX" },
          { name: "Screen 4 - VIP Lounge Class", screen_tier: "Standard" },
        ],
      },
      {
        name: "INOX Himalaya Mall",
        address: "Drive In Road, Nilmani Society, Gurukul",
        screens: [
          { name: "Screen 1 - Laser IMAX Experience", screen_tier: "IMAX" },
          { name: "Screen 2 - Dolby Atmos BigPix", screen_tier: "Standard" },
          { name: "Screen 3 - ScreenX 270 Panoramic", screen_tier: "Standard" },
          { name: "Screen 4 - Digital Classic", screen_tier: "Standard" },
        ],
      },
    ],

    vellore: [
      {
        name: "PVR Velocity Silk Mill",
        address: "Officer's Line, Toll Gate, Vellore",
        screens: [
          { name: "Audi 1 - Laser IMAX", screen_tier: "IMAX" },
          { name: "Audi 2 - 4DX Thrill Theater", screen_tier: "4DX" },
          { name: "Audi 3 - Dolby Atmos Premiere", screen_tier: "Standard" },
        ],
      },
      {
        name: "INOX Brookfield Katpadi",
        address: "Katpadi Main Road, Suthanthira Ponvizha Nagar, Vellore",
        screens: [
          { name: "Screen 1 - Laser XE Dolby Atmos", screen_tier: "Standard" },
          { name: "Screen 2 - Dolby 7.1 Classic", screen_tier: "Standard" },
          { name: "Screen 3 - VIP Luxe Class", screen_tier: "Standard" },
        ],
      },
    ],
  };

  // Fetch all existing cinemas & screens to prevent duplicate constraint errors
  const { data: existingCinemas, error: exCinErr } = await supabase
    .from("cinemas")
    .select("id, name, city_id");
  if (exCinErr) throw new Error(`Failed to fetch cinemas: ${exCinErr.message}`);

  const { data: existingScreens, error: exScrErr } = await supabase
    .from("screens")
    .select("id, name, cinema_id, screen_tier");
  if (exScrErr) throw new Error(`Failed to fetch screens: ${exScrErr.message}`);

  const allActiveScreens: { id: string; name: string; cinema_id: string; screen_tier: ScreenTier }[] = [];

  for (const city of dbCities) {
    const list = cinemasConfig[city.slug] || [];
    if (list.length === 0) {
      console.warn(`   ⚠️ Warning: No cinema config for city ${city.name} (${city.slug})`);
      continue;
    }

    for (const conf of list) {
      let cinemaId: string;
      const existing = existingCinemas?.find(
        (ec) => ec.name.trim().toLowerCase() === conf.name.trim().toLowerCase() && ec.city_id === city.id
      );

      if (existing) {
        cinemaId = existing.id;
      } else {
        const { data: newCin, error: newCinErr } = await supabase
          .from("cinemas")
          .insert({
            name: conf.name,
            address: conf.address,
            city_id: city.id,
          })
          .select("id, name")
          .single();

        if (newCinErr) throw new Error(`Failed to insert cinema ${conf.name}: ${newCinErr.message}`);
        cinemaId = newCin.id;
        console.log(`      + Created Cinema: ${conf.name} in ${city.name}`);
      }

      for (const scrConf of conf.screens) {
        let screenId: string;
        const existingScr = existingScreens?.find(
          (es) => es.cinema_id === cinemaId && es.name.trim().toLowerCase() === scrConf.name.trim().toLowerCase()
        );

        if (existingScr) {
          screenId = existingScr.id;
          allActiveScreens.push(existingScr);
        } else {
          const { data: newScr, error: newScrErr } = await supabase
            .from("screens")
            .insert({
              cinema_id: cinemaId,
              name: scrConf.name,
              screen_tier: scrConf.screen_tier,
            })
            .select("id, name, cinema_id, screen_tier")
            .single();

          if (newScrErr) throw new Error(`Failed to insert screen ${scrConf.name}: ${newScrErr.message}`);
          screenId = newScr.id;
          allActiveScreens.push(newScr);
          console.log(`         + Created Screen: ${scrConf.name} (${scrConf.screen_tier})`);
        }
      }
    }
  }

  console.log(`   ✅ Confirmed total active screens across all cities: ${allActiveScreens.length}`);

  // --------------------------------------------------------------------------
  // 3. Movies Catalog Verification & Even Distribution Setup (Telugu Blockbusters + 2025-2026 Releases)
  // --------------------------------------------------------------------------
  console.log("\n🎞️  [3/5] Syncing Full Telugu Movie Catalog (22 Titles) with Authentic CDN Artwork...");

  const teluguCatalog = [
    // --- Classic & Blockbuster Catalog (12 Titles) ---
    {
      title: "Baahubali: The Beginning",
      genre: ["Action", "Drama", "Fantasy"],
      duration_min: 159,
      censor: "U/A",
      langs: ["Telugu", "Tamil", "Hindi", "Malayalam"],
      release_date: "2015-07-10",
      poster_url: "https://image.tmdb.org/t/p/w780/pU1ULUq8D3iRxl1fdX2lZIzdHuI.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/5a7lMDn3nAj2ByO0X1fg6BhUphR.jpg",
    },
    {
      title: "Baahubali 2: The Conclusion",
      genre: ["Action", "Drama", "Fantasy"],
      duration_min: 167,
      censor: "U/A",
      langs: ["Telugu", "Tamil", "Hindi", "Malayalam"],
      release_date: "2017-04-28",
      poster_url: "https://image.tmdb.org/t/p/w780/ltyARDw2EFXZ2H2ERnlEctXPioP.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/a9jZrU7LJk6mAUjmkbEmTiC52l0.jpg",
    },
    {
      title: "Kalki 2898 AD",
      genre: ["Sci-Fi", "Action", "Fantasy"],
      duration_min: 181,
      censor: "U/A",
      langs: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
      release_date: "2024-06-27",
      poster_url: "https://image.tmdb.org/t/p/w780/3HzGtM0JpfH2pWFGugJK22LRP6b.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
    },
    {
      title: "RRR",
      genre: ["Action", "Drama", "History"],
      duration_min: 182,
      censor: "U/A",
      langs: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
      release_date: "2022-03-25",
      poster_url: "https://image.tmdb.org/t/p/w780/tjpiEnZBUAA8pdNPRKa5vP2Zpqw.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/i0Y0wP8H6SRgjr6QmuwbtQbS24D.jpg",
    },
    {
      title: "Salaar: Part 1 - Ceasefire",
      genre: ["Action", "Crime", "Drama"],
      duration_min: 175,
      censor: "A",
      langs: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
      release_date: "2023-12-22",
      poster_url: "https://image.tmdb.org/t/p/w780/gC5HfzG2xUbqSPaXPdqTiE94c79.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/l57Hoy9prfwpewKm7PEYxOiJeMr.jpg",
    },
    {
      title: "Pushpa: The Rise",
      genre: ["Action", "Crime", "Drama"],
      duration_min: 179,
      censor: "U/A",
      langs: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
      release_date: "2021-12-17",
      poster_url: "http://www.impawards.com/intl/india/2021/posters/pushpa_the_rise__part_one_xlg.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/5a7lMDn3nAj2ByO0X1fg6BhUphR.jpg",
    },
    {
      title: "Pushpa 2: The Rule",
      genre: ["Action", "Crime", "Drama"],
      duration_min: 200,
      censor: "U/A",
      langs: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
      release_date: "2024-12-05",
      poster_url: "http://www.impawards.com/intl/india/2024/posters/pushpa_the_rule__part_two_xlg.jpg",
      backdrop_url: "https://upload.wikimedia.org/wikipedia/en/1/11/Pushpa_2-_The_Rule.jpg",
    },
    {
      title: "Devara: Part 1",
      genre: ["Action", "Drama", "Thriller"],
      duration_min: 178,
      censor: "U/A",
      langs: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
      release_date: "2024-09-27",
      poster_url: "https://image.tmdb.org/t/p/w780/uByCHJa3eaCL0SgFGDYYLlsVggC.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/uByCHJa3eaCL0SgFGDYYLlsVggC.jpg",
    },
    {
      title: "Hanu-Man",
      genre: ["Action", "Adventure", "Fantasy"],
      duration_min: 158,
      censor: "U/A",
      langs: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
      release_date: "2024-01-12",
      poster_url: "https://image.tmdb.org/t/p/w780/iZTfOhaSTjBcwgRBm0zfD5gqemJ.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/f3ONMmF8IH85M9ewOSXXPqHECPX.jpg",
    },
    {
      title: "Ala Vaikunthapurramuloo",
      genre: ["Action", "Comedy", "Drama"],
      duration_min: 165,
      censor: "U/A",
      langs: ["Telugu", "Malayalam"],
      release_date: "2020-01-12",
      poster_url: "https://image.tmdb.org/t/p/w780/hxay11Z1TrGU2R39JEUZdAPKdHG.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/3rWjPTE2hXXhMDUgL0T73wiMBHU.jpg",
    },
    {
      title: "Rangasthalam",
      genre: ["Action", "Drama", "Period"],
      duration_min: 174,
      censor: "U/A",
      langs: ["Telugu"],
      release_date: "2018-03-30",
      poster_url: "https://image.tmdb.org/t/p/w780/f4FF18ia7yTvHf2izNrHqBmgH8U.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/isnJGDrfR9dIrHMsPTvHtJaGEpc.jpg",
    },
    {
      title: "Saripodhaa Sanivaaram",
      genre: ["Action", "Thriller", "Drama"],
      duration_min: 175,
      censor: "U/A",
      langs: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
      release_date: "2024-08-29",
      poster_url: "https://image.tmdb.org/t/p/w780/gmJ29b6r3zNWA9HEW3V95H2DF7u.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/gmJ29b6r3zNWA9HEW3V95H2DF7u.jpg",
    },

    // --- 2025–2026 Catalog (10 Titles) ---
    {
      title: "The Paradise",
      genre: ["Action", "Drama", "Thriller"],
      duration_min: 162,
      censor: "U/A",
      langs: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
      release_date: "2026-09-24",
      poster_url: "https://upload.wikimedia.org/wikipedia/en/b/bb/The_Paradise_%282026_Indian_film%29_poster.jpg",
      backdrop_url: "https://upload.wikimedia.org/wikipedia/en/b/bb/The_Paradise_%282026_Indian_film%29_poster.jpg",
    },
    {
      title: "The RajaSaab",
      genre: ["Horror", "Comedy", "Romance"],
      duration_min: 168,
      censor: "U/A",
      langs: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
      release_date: "2026-04-10",
      poster_url: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgdPirJn7Ly_QcvIi388z2Lwt0xAE5qu6YtmJVct7BfQIyIm_rWPGVe8LLdNWNGiLMpR9hDmQE4n5PC7zUiRLvQ7IThuRPOYG-U7D8pzGfZV3Hnxgxl35riURBj_uXFsfZl7e8AQAbzy_0uy7RlDCbRhZN-OIHAzQ0gD2eZEOdq_GLwkQ2R7Qx4K-gS0svb/s1468/TheRajaSaab001.png",
      backdrop_url: "https://wallpaperaccess.com/full/26453064.jpg",
    },
    {
      title: "Vishwambhara",
      genre: ["Fantasy", "Action"],
      duration_min: 175,
      censor: "U/A",
      langs: ["Telugu", "Hindi", "Tamil", "Kannada", "Malayalam"],
      release_date: "2026-01-10",
      poster_url: "https://image.tmdb.org/t/p/w780/yJF3pPAg4ipOv9SY2XrcBQFpTSH.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/yJF3pPAg4ipOv9SY2XrcBQFpTSH.jpg",
    },
    {
      title: "Ustaad Bhagat Singh",
      genre: ["Action", "Drama"],
      duration_min: 165,
      censor: "U/A",
      langs: ["Telugu", "Tamil", "Hindi"],
      release_date: "2026-05-01",
      poster_url: "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjd7Aq0R8SU4Trrx32NNeXPv8y-cAscqtWvwVTbczxJGQ7PwfARRIqLMvcBrM0eTVMEirL6KlJq-EGWj8zEe2diPHYBU_YMAmz64FurArHGicQrUgIMNKrZZ1tK9XMHU_r_rS8m-cprQiAxBO2XX-NJr0NYvPPTGIZmzlgKkPDQWXtoABM9bEnJqusANmH2/s1500/UBS001.jpg",
      backdrop_url: "https://gallery.123telugu.com/content/slideshows/2026/3/Ustaad-Bhagat-Singh1/images/Ustaad%20Bhagat%20Singh-001.jpg",
    },
    {
      title: "Goodachari 2 (G2)",
      genre: ["Action", "Thriller", "Espionage"],
      duration_min: 158,
      censor: "U/A",
      langs: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
      release_date: "2026-07-17",
      poster_url: "https://upload.wikimedia.org/wikipedia/en/5/5a/G2_%28film%29_poster.jpeg",
      backdrop_url: "https://upload.wikimedia.org/wikipedia/en/5/5a/G2_%28film%29_poster.jpeg",
    },
    {
      title: "They Call Him OG",
      genre: ["Action", "Crime"],
      duration_min: 170,
      censor: "A",
      langs: ["Telugu", "Tamil", "Hindi", "Kannada", "Malayalam"],
      release_date: "2025-09-27",
      poster_url: "https://image.tmdb.org/t/p/w780/7YTTveWQ3WIQiiPGWsUx05qA5Uq.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/7YTTveWQ3WIQiiPGWsUx05qA5Uq.jpg",
    },
    {
      title: "Mirai - Super Yodha",
      genre: ["Action", "Fantasy", "Adventure"],
      duration_min: 152,
      censor: "U/A",
      langs: ["Telugu", "Hindi", "Tamil", "Malayalam", "Kannada"],
      release_date: "2025-09-12",
      poster_url: "https://upload.wikimedia.org/wikipedia/en/9/9f/Mirai_%282025_film%29_poster.jpg",
      backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80",
    },
    {
      title: "Hari Hara Veera Mallu",
      genre: ["Period", "Action", "Drama"],
      duration_min: 178,
      censor: "U/A",
      langs: ["Telugu", "Tamil", "Hindi", "Malayalam", "Kannada"],
      release_date: "2025-10-31",
      poster_url: "https://image.tmdb.org/t/p/w780/1gFSXInMYebLp89V2r0woRFIgZM.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/vg0n59EwKomMNJwlbt1CqlgFDI2.jpg",
    },
    {
      title: "Game Changer",
      genre: ["Action", "Political", "Drama"],
      duration_min: 165,
      censor: "U/A",
      langs: ["Telugu", "Tamil", "Hindi"],
      release_date: "2025-01-10",
      poster_url: "https://image.tmdb.org/t/p/w780/d8Ryb8AunYAuycVKDp5HpdWPKgC.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/zOpe0eHsq0A2NvNyBbtT6sj53qV.jpg",
    },
    {
      title: "Daaku Maharaaj",
      genre: ["Action", "Drama"],
      duration_min: 160,
      censor: "U/A",
      langs: ["Telugu", "Tamil", "Hindi"],
      release_date: "2025-01-12",
      poster_url: "https://image.tmdb.org/t/p/w780/qfalw4Ipiesm1ZF5wTvoKTZlfxW.jpg",
      backdrop_url: "https://image.tmdb.org/t/p/original/qfalw4Ipiesm1ZF5wTvoKTZlfxW.jpg",
    },
  ];

  // Fetch all existing movies in database
  const { data: existingDbMovies, error: movieFetchErr } = await supabase
    .from("movies")
    .select("id, title");
  if (movieFetchErr) throw new Error(`Failed to fetch movies: ${movieFetchErr.message}`);

  const existingByTitle = new Map(
    (existingDbMovies || []).map((m) => [m.title.trim().toLowerCase(), m])
  );

  const activeMovies: { id: string; title: string }[] = [];

  for (const m of teluguCatalog) {
    const existing = existingByTitle.get(m.title.trim().toLowerCase());

    if (existing) {
      // ON CONFLICT (title) DO UPDATE
      const { data: updated, error: updErr } = await supabase
        .from("movies")
        .update({
          poster_url: m.poster_url,
          backdrop_url: m.backdrop_url,
          genre: m.genre,
          duration_min: m.duration_min,
          release_date: m.release_date,
          censor_rating: m.censor,
          languages: m.langs,
        })
        .eq("id", existing.id)
        .select("id, title")
        .single();

      if (updErr) throw new Error(`Failed to update movie ${m.title}: ${updErr.message}`);
      activeMovies.push(updated || existing);
    } else {
      // Insert new movie title
      const { data: inserted, error: insErr } = await supabase
        .from("movies")
        .insert({
          title: m.title,
          poster_url: m.poster_url,
          backdrop_url: m.backdrop_url,
          genre: m.genre,
          duration_min: m.duration_min,
          release_date: m.release_date,
          censor_rating: m.censor,
          languages: m.langs,
        })
        .select("id, title")
        .single();

      if (insErr) throw new Error(`Failed to insert movie ${m.title}: ${insErr.message}`);
      activeMovies.push(inserted);
    }
  }

  console.log(`   ✅ Synced Telugu Movie Catalog (${activeMovies.length} titles):`);
  activeMovies.forEach((m) => console.log(`      - ${m.title}`));

  // --------------------------------------------------------------------------
  // 4. Standard 180-Seat Matrix Generation (15 Rows x 12 Columns = 180 Seats)
  // --------------------------------------------------------------------------
  console.log("\n💺 [4/5] Checking Standard 180-Seat Matrix (15 Rows A-O x 12 Seats)...");

  const rowLetters = "ABCDEFGHIJKLMNO".split("");
  const rowConfigs = rowLetters.map((letter, idx) => {
    let type: SeatType = "CLASSIC";
    let basePrice = 220;

    if (idx >= 0 && idx < 5) {
      type = "CLASSIC"; // Rows A-E: 60 Classic seats
      basePrice = 220;
    } else if (idx >= 5 && idx < 12) {
      type = "PRIME"; // Rows F-L: 84 Prime seats
      basePrice = 320;
    } else {
      type = "RECLINER"; // Rows M-O: 36 Recliner seats
      basePrice = 550;
    }

    return { label: letter, type, basePrice };
  });

  const seatsToInsert: {
    screen_id: string;
    row_label: string;
    seat_number: number;
    seat_type: SeatType;
    price: number;
  }[] = [];

  for (const screen of allActiveScreens) {
    const { count, error: seatCountErr } = await supabase
      .from("seats")
      .select("id", { count: "exact", head: true })
      .eq("screen_id", screen.id);

    if (seatCountErr) throw new Error(`Error checking seats for screen ${screen.id}: ${seatCountErr.message}`);

    if (count && count >= 180) {
      continue; // Screen already has its 180-seat layout
    }

    let multiplier = 1.0;
    if (screen.screen_tier === "IMAX") multiplier = 1.4;
    else if (screen.screen_tier === "4DX") multiplier = 1.3;

    for (const r of rowConfigs) {
      for (let seatNum = 1; seatNum <= 12; seatNum++) {
        seatsToInsert.push({
          screen_id: screen.id,
          row_label: r.label,
          seat_number: seatNum,
          seat_type: r.type,
          price: Math.round(r.basePrice * multiplier),
        });
      }
    }
  }

  if (seatsToInsert.length > 0) {
    console.log(`   ⏳ Generating ${seatsToInsert.length} seats for newly provisioned screens...`);
    const SEAT_BATCH_SIZE = 1000;
    const seatChunks = chunkArray(seatsToInsert, SEAT_BATCH_SIZE);

    let batchNum = 0;
    for (const chunk of seatChunks) {
      batchNum++;
      const { error: seatInsertErr } = await supabase
        .from("seats")
        .upsert(chunk, { onConflict: "screen_id,row_label,seat_number" });

      if (seatInsertErr) {
        throw new Error(`Error inserting seats batch #${batchNum}: ${seatInsertErr.message}`);
      }
      process.stdout.write(
        `\r   ⚡ Seats progress: Batch ${batchNum}/${seatChunks.length} (${Math.min(batchNum * SEAT_BATCH_SIZE, seatsToInsert.length)} / ${seatsToInsert.length} seats)`
      );
    }
    console.log(`\n   ✅ Successfully verified/seeded seats for all screens.`);
  } else {
    console.log(`   ✅ All ${allActiveScreens.length} screens already possess standard 180-seat layouts.`);
  }

  // --------------------------------------------------------------------------
  // 5. Uniform Multi-City Movie Scheduling (4 Shows / Day / Screen for Next 3 Days)
  // --------------------------------------------------------------------------
  console.log("\n🎟️  [5/5] Uniform Movie Scheduling Across All Cities (4 Shows/Day x 3 Days)...");

  const today = new Date();
  const days = [0, 1, 2].map((offset) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return formatDate(d);
  });

  const slots = [
    { start: "10:00:00", end: "13:00:00", label: "Morning" },
    { start: "13:30:00", end: "16:30:00", label: "Matinee" },
    { start: "17:30:00", end: "20:30:00", label: "Evening" },
    { start: "21:00:00", end: "23:59:00", label: "Night" },
  ];

  console.log(`   Schedule Dates: ${days.join(", ")}`);
  console.log(`   Showtime Slots: ${slots.map((s) => `${s.label} (${s.start.slice(0, 5)})`).join(", ")}`);

  // Prune expired past shows older than today
  const { error: pruneErr } = await supabase
    .from("shows")
    .delete()
    .lt("date", days[0]);
  if (!pruneErr) {
    console.log(`   🧹 Pruned expired past shows older than ${days[0]}.`);
  }

  // Fetch any existing bookings to preserve shows with active reservations
  const { data: bookedRows } = await supabase.from("bookings").select("show_id");
  const bookedShowIds = new Set((bookedRows || []).map((b) => b.show_id));

  // Fetch existing shows for these days
  const { data: existingShows, error: exShowsErr } = await supabase
    .from("shows")
    .select("id, screen_id, date, start_time")
    .in("date", days);

  if (exShowsErr) throw new Error(`Failed to fetch existing shows: ${exShowsErr.message}`);

  // Delete unbooked shows for these days so the full 22-movie catalog is scheduled evenly
  const showsToDelete = (existingShows || [])
    .filter((s) => !bookedShowIds.has(s.id))
    .map((s) => s.id);

  if (showsToDelete.length > 0) {
    console.log(`   🧹 Clearing ${showsToDelete.length} unbooked shows to evenly reschedule 22-movie catalog...`);
    const delChunks = chunkArray(showsToDelete, 400);
    for (const dChunk of delChunks) {
      await supabase.from("shows").delete().in("id", dChunk);
    }
  }

  // Any remaining booked shows retain their slot
  const retainedShows = (existingShows || []).filter((s) => bookedShowIds.has(s.id));
  const existingSlotSet = new Set(
    retainedShows.map((s) => `${s.screen_id}_${s.date}_${s.start_time.slice(0, 5)}`)
  );

  const showsToInsert: {
    screen_id: string;
    movie_id: string;
    date: string;
    start_time: string;
    end_time: string;
  }[] = [];

  let movieIndex = 0;

  for (const screen of allActiveScreens) {
    for (const date of days) {
      for (const slot of slots) {
        const slotKey = `${screen.id}_${date}_${slot.start.slice(0, 5)}`;
        if (existingSlotSet.has(slotKey)) {
          continue; // Slot already scheduled
        }

        const assignedMovie = activeMovies[movieIndex % activeMovies.length];
        movieIndex++;

        showsToInsert.push({
          screen_id: screen.id,
          movie_id: assignedMovie.id,
          date,
          start_time: slot.start,
          end_time: slot.end,
        });
      }
    }
  }

  if (showsToInsert.length > 0) {
    console.log(`   ⏳ Inserting ${showsToInsert.length} new showtimes in batches...`);
    const SHOW_BATCH_SIZE = 400;
    const showChunks = chunkArray(showsToInsert, SHOW_BATCH_SIZE);

    let showBatch = 0;
    for (const chunk of showChunks) {
      showBatch++;
      const { error: showInsertErr } = await supabase.from("shows").insert(chunk);
      if (showInsertErr) {
        throw new Error(`Error inserting shows batch #${showBatch}: ${showInsertErr.message}`);
      }
      process.stdout.write(`\r   ⚡ Shows progress: Batch ${showBatch}/${showChunks.length}`);
    }
    console.log(`\n   ✅ Successfully scheduled ${showsToInsert.length} new shows.`);
  } else {
    console.log(`   ✅ All ${allActiveScreens.length} screens are already fully scheduled for the next 3 days.`);
  }

  // --------------------------------------------------------------------------
  // Verification Query
  // --------------------------------------------------------------------------
  const { count: finalCinemasCount } = await supabase.from("cinemas").select("id", { count: "exact", head: true });
  const { count: finalScreensCount } = await supabase.from("screens").select("id", { count: "exact", head: true });
  const { count: finalShowsCount } = await supabase.from("shows").select("id", { count: "exact", head: true });
  const { count: finalSeatsCount } = await supabase.from("seats").select("id", { count: "exact", head: true });

  console.log("\n======================================================================");
  console.log("🎉 Seeding & Uniform Scheduling Completed Successfully!");
  console.log("======================================================================");
  console.log(`🏙️  Cities Covered:      ${dbCities.length} (including Vellore)`);
  console.log(`🏢  Total Cinemas:       ${finalCinemasCount} multiplexes`);
  console.log(`🖥️  Total Screens:       ${finalScreensCount} auditoriums (IMAX, 4DX, Standard)`);
  console.log(`🎬  Movies Catalog:      ${activeMovies.length} titles distributed evenly`);
  console.log(`💺  Total Seats:         ${finalSeatsCount?.toLocaleString()} seats (180/screen)`);
  console.log(`🎟️  Total Scheduled:     ${finalShowsCount?.toLocaleString()} shows`);
  console.log("======================================================================\n");
}

seed()
  .then(() => {
    console.log("✨ Seeding workflow completed without duplicate constraint errors.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed script failed:", err.message);
    process.exit(1);
  });
