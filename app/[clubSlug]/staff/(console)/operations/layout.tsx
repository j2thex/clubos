import { notFound } from "next/navigation";
import { getClub } from "@/lib/data/club";
import { createAdminClient } from "@/lib/supabase/admin";
import { clubDayStartIso } from "@/lib/club-time";
import { OperationsTabs, type OperationsTab } from "@/components/club/operations-tabs";

export const dynamic = "force-dynamic";

export default async function StaffOperationsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const club = await getClub(clubSlug);

  if (!club || !club.operations_module_enabled) {
    notFound();
  }

  const navPosition: "bottom" | "top" = club.nav_position === "top" ? "top" : "bottom";
  const supabase = createAdminClient();
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

  const basePath = `/${clubSlug}/staff/operations`;
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
    { key: "products", labelKey: "ops.tabProducts", href: `${basePath}/products` },
  ];

  return (
    <div className="space-y-4">
      <OperationsTabs portal="staff" tabs={tabs} navPosition={navPosition} />
      {children}
    </div>
  );
}
