import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

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
      "id, slug, name, currency, telegram_bot_referral_name, telegram_bot_registration_price, telegram_bot_welcome_message"
    )
    .eq("telegram_bot_enabled", true)
    .eq("active", true)
    .eq("invite_only", true);

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

  const result = clubs.map((c) => ({
    slug: c.slug,
    name: c.name,
    currency: c.currency,
    referral_name: c.telegram_bot_referral_name,
    registration_price: c.telegram_bot_registration_price,
    welcome_message: c.telegram_bot_welcome_message,
    membership_periods: (periodsByClub.get(c.id) ?? []).map((p) => ({
      name: p.name,
      duration_months: p.duration_months,
      price: p.price,
    })),
  }));

  return NextResponse.json(
    { clubs: result },
    { headers: { "Cache-Control": "no-store" } }
  );
}
