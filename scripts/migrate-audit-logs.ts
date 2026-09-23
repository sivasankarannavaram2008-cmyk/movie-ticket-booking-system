import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  console.log("=== Supabase Migration 002_audit_logs ===");
  const sqlPath = path.join(process.cwd(), "supabase", "migrations", "002_audit_logs.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");
  console.log(`Loaded migration SQL from ${sqlPath} (${sql.length} bytes).`);

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("placeholder") || supabaseKey.includes("placeholder")) {
    console.log("⚠️  Supabase live credentials not configured. The migration script is ready at supabase/migrations/002_audit_logs.sql.");
    return;
  }

  const client = createClient(supabaseUrl, supabaseKey);
  console.log("Connected to Supabase. Checking booking_audit_logs table...");
  const { data, error } = await client.from("booking_audit_logs").select("id").limit(1);
  if (error && error.message.includes("does not exist")) {
    console.log("Table booking_audit_logs does not exist yet. Please execute 002_audit_logs.sql in Supabase SQL editor.");
  } else if (!error) {
    console.log("✅ booking_audit_logs table exists and is accessible!");
  } else {
    console.log("Table check status:", error.message);
  }
}

run().catch(console.error);
