import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getTestClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    process.env.SUPABASE_TEST_URL!,
    process.env.SUPABASE_TEST_SERVICE_ROLE!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cached;
}
