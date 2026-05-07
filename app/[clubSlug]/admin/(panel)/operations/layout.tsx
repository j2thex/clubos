import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { clubDayStartIso } from "@/lib/club-time";
import { OperationsTabs, type OperationsTab } from "@/components/club/operations-tabs";

export const dynamic = "force-dynamic";

export default async function AdminOperationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, timezone, nav_position")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  const navPosition: "bottom" | "top" = club.nav_position === "top" ? "top" : "bottom";

  const dayStart = clubDayStartIso(new Date(), club.timezone ?? "Europe/Madrid");

  const [{ count: insideCount }, { count: todayTxCount }] = await Promise.all([
    supabase
      .from("club_entries")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.id)
      .is("checked_out_at", null),
    supabase
      .from("product_transactions")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.id)
      .is("voided_at", null)
      .gte("created_at", dayStart),
  ]);

  const basePath = `/${clubSlug}/admin/operations`;
  const tabs: OperationsTab[] = [
    { key: "overview", labelKey: "ops.tabOverview", href: basePath },
    { key: "entry", labelKey: "ops.tabEntry", href: `${basePath}/entry` },
    {
      key: "capacity",
      labelKey: "ops.tabCapacity",
      href: `${basePath}/capacity`,
      badge: insideCount ?? 0,
    },
    { key: "sell", labelKey: "ops.tabSell", href: `${basePath}/sell` },
    {
      key: "transactions",
      labelKey: "ops.tabTransactions",
      href: `${basePath}/transactions`,
      badge: todayTxCount ?? 0,
    },
  ];

  return (
    <div className="space-y-4">
      <OperationsTabs portal="admin" tabs={tabs} navPosition={navPosition} />
      {children}
    </div>
  );
}
