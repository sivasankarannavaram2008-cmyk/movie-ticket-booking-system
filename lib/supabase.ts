import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Singleton Supabase admin client configured with SUPABASE_SERVICE_ROLE_KEY.
 * Bypasses Row Level Security (RLS) for server-side operations, background jobs, and admin mutations.
 * Strictly for server-side environments (Server Components, Route Handlers, Server Actions).
 */
/**
 * Check if valid Supabase credentials exist in environment
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseServiceRoleKey &&
    !supabaseUrl.includes("placeholder") &&
    !supabaseServiceRoleKey.includes("placeholder")
  );
}

let adminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (!adminClient) {
    adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return adminClient;
}

export const supabaseAdmin = getSupabaseAdmin();

/**
 * Singleton client for public/client queries subject to Row Level Security (RLS).
 */
let publicClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient(): SupabaseClient<Database> {
  if (!publicClient) {
    publicClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: typeof window !== "undefined",
      },
    });
  }
  return publicClient;
}

export const supabase = getSupabaseClient();

export default supabaseAdmin;
