import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fetch club + branding by slug. Wrapped in React.cache() so multiple
 * calls within the same request (e.g. layout + page) only hit the DB once.
 */
export const getClub = cache(async (slug: string) => {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("clubs")
    .select("*, club_branding(*)")
    .eq("slug", slug)
    .eq("active", true)
    .single();
  return data;
});
