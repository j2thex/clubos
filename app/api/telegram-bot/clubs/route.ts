import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { getStatus, type WorkingHours } from "@/lib/working-hours";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.TELEGRAM_BOT_API_KEY;

  if (!expectedKey || !authHeader || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select(
      "id, slug, name, currency, latitude, longitude, telegram_bot_referral_name, telegram_bot_registration_price, telegram_bot_welcome_message, telegram_bot_keywords, telegram_bot_age_restricted, working_hours, timezone"
    )
    .eq("telegram_bot_enabled", true)
    .eq("active", true);

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const clubIds = clubs.map((c) => c.id);

  const { data: periods } =
    clubIds.length > 0
      ? await supabase
          .from("membership_periods")
          .select("club_id, name, duration_months, price")
          .in("club_id", clubIds)
          .eq("active", true)
          .order("display_order", { ascending: true })
      : { data: [] as { club_id: string; name: string; duration_months: number; price: number | null }[] };

  const periodsByClub = new Map<string, typeof periods>();
  for (const p of periods ?? []) {
    const arr = periodsByClub.get(p.club_id) ?? [];
    arr.push(p);
    periodsByClub.set(p.club_id, arr);
  }

  const now = new Date();

  const result = clubs.map((c) => {
    const workingHours = (c.working_hours ?? null) as WorkingHours | null;
    const timezone = (c.timezone ?? null) as string | null;
    const status = workingHours && timezone ? getStatus(workingHours, timezone, now) : null;

    return {
      name: c.name,
      keywords: c.telegram_bot_keywords ?? [],
      inviter: c.telegram_bot_referral_name,
      ageRestricted: c.telegram_bot_age_restricted ?? true,
      lat: c.latitude ?? undefined,
      lng: c.longitude ?? undefined,
      slug: c.slug,
      currency: c.currency,
      registrationPrice: c.telegram_bot_registration_price,
      welcomeMessage: c.telegram_bot_welcome_message,
      membershipPeriods: (periodsByClub.get(c.id) ?? []).map((p) => ({
        name: p.name,
        duration_months: p.duration_months,
        price: p.price,
      })),
      // Source-of-truth schedule for the bot to recompute live (cache-safe).
      // null when the club hasn't configured hours/timezone — bot should treat as "always available".
      workingHours,
      timezone,
      // Snapshot at fetch time. Bot SHOULD recompute from workingHours+timezone
      // for each user message; this snapshot is a hint for non-cached calls.
      isOpenNow: status?.open ?? null,
      closesAt: status?.open ? status.closesAt : null,
      nextOpenDay: status && !status.open ? status.nextOpenDay : null,
      nextOpenTime: status && !status.open ? status.nextOpenTime : null,
    };
  });

  return NextResponse.json(
    { clubs: result },
    { headers: { "Cache-Control": "no-store" } }
  );
}
