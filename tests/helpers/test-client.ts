import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getTestClient(): SupabaseClient {
  if (cached) return cached;

  const required = ["SUPABASE_TEST_URL", "SUPABASE_TEST_SERVICE_ROLE"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(
      `Missing test env: ${missing.join(", ")}. ` +
        `Run \`pnpm supabase start\` then copy the API URL + service_role key into .env.test.local. ` +
        `See .env.test.example.`,
    );
  }

  cached = createClient(
    process.env.SUPABASE_TEST_URL!,
    process.env.SUPABASE_TEST_SERVICE_ROLE!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cached;
}
