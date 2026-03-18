import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> },
) {
  const { clubId } = await params;
  const secret = request.nextUrl.searchParams.get("secret");

  if (!secret) {
    return NextResponse.json({ error: "Missing secret" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Validate secret
  const { data: club } = await supabase
    .from("clubs")
    .select("notification_secret")
    .eq("id", clubId)
    .eq("active", true)
    .single();

  if (!club || club.notification_secret !== secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  // Get club's quest and service IDs to scope the pending counts
  const [{ data: clubQuests }, { data: clubServices }] = await Promise.all([
    supabase.from("quests").select("id").eq("club_id", clubId),
    supabase.from("services").select("id").eq("club_id", clubId),
  ]);

  const questIds = (clubQuests ?? []).map((q) => q.id);
  const serviceIds = (clubServices ?? []).map((s) => s.id);

  // Count pending items
  const [questResult, serviceResult] = await Promise.all([
    questIds.length > 0
      ? supabase
          .from("member_quests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("quest_id", questIds)
      : Promise.resolve({ count: 0 }),
    serviceIds.length > 0
      ? supabase
          .from("service_orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending")
          .in("service_id", serviceIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const quests = questResult.count ?? 0;
  const services = serviceResult.count ?? 0;
  const pending = quests + services;

  return NextResponse.json(
    { light: pending > 0, pending, quests, services },
    {
      headers: {
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
