import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function StaffOperationsPage({
  params,
}: {
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const { count: insideCount } = await supabase
    .from("club_entries")
    .select("*", { count: "exact", head: true })
    .eq("club_id", club.id)
    .is("checked_out_at", null);

  const locale = await getServerLocale();

  const [{ count: productCount }, { count: todayTxCount }] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.id)
      .eq("archived", false)
      .eq("active", true),
    supabase
      .from("product_transactions")
      .select("*", { count: "exact", head: true })
      .eq("club_id", club.id)
      .is("voided_at", null)
      .gte("created_at", new Date(new Date().toDateString()).toISOString()),
  ]);

  const cards = [
    {
      href: `/${clubSlug}/staff/operations/entry`,
      title: t(locale, "ops.entryCardTitle"),
      body: t(locale, "ops.entryCardBody"),
    },
    {
      href: `/${clubSlug}/staff/operations/capacity`,
      title: t(locale, "ops.capacityCardTitle"),
      body: t(locale, "ops.capacityCardBody", { count: insideCount ?? 0 }),
    },
    {
      href: `/${clubSlug}/staff/operations/sell`,
      title: t(locale, "ops.sellCardTitle"),
      body: t(locale, "ops.sellCardBody"),
    },
    {
      href: `/${clubSlug}/staff/operations/transactions`,
      title: t(locale, "ops.transactionsCardTitle"),
      body: t(locale, "ops.transactionsCardBody", { count: todayTxCount ?? 0 }),
    },
    {
      href: `/${clubSlug}/staff/operations/products`,
      title: t(locale, "ops.productsCardTitle"),
      body: t(locale, "ops.productsCardBody", { count: productCount ?? 0 }),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t(locale, "ops.title")}
      </h1>
      <div className="grid grid-cols-1 gap-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="bg-white rounded-2xl shadow-lg p-5 hover:bg-gray-50 transition-colors"
          >
            <p className="font-semibold text-gray-900">{c.title}</p>
            <p className="text-xs text-gray-500 mt-1">{c.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
