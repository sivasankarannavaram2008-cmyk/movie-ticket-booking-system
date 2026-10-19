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

async function testScreenQuery() {
  const targetCity = "hyderabad";
  const { data: targetScreen, error } = await supabase
    .from("screens")
    .select("id, name, cinemas!inner(name, cities!inner(name, slug))")
    .eq("cinemas.cities.slug", targetCity)
    .limit(1)
    .maybeSingle();

  console.log("Test targetScreen query for hyderabad:", targetScreen, error);
}

testScreenQuery().catch(console.error);
