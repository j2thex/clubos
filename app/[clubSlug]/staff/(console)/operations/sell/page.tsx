import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { requireStaffPermission } from "@/lib/auth";
import { NoAccessCard } from "@/components/club/no-access-card";
import { SellClient, type SellProduct } from "./sell-client";

export const dynamic = "force-dynamic";

export default async function StaffOperationsSellPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ memberCode?: string }>;
}) {
  const { clubSlug } = await params;
  const { memberCode: initialMemberCode } = await searchParams;
  const supabase = createAdminClient();
  const locale = await getServerLocale();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  try {
    await requireStaffPermission(club.id, "sell");
  } catch {
    return <NoAccessCard permission="sell" clubSlug={clubSlug} locale={locale} />;
  }

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, name_es, unit, unit_price, stock_on_hand, image_url, category:product_categories(name)",
    )
    .eq("club_id", club.id)
    .eq("archived", false)
    .eq("active", true)
    .order("display_order", { ascending: true });

  const rows: SellProduct[] = (products ?? []).map((p) => {
    const cat = Array.isArray(p.category) ? p.category[0] : p.category;
    return {
      id: p.id,
      name: locale === "es" && p.name_es ? p.name_es : p.name,
      nameEs: p.name_es ?? null,
      categoryName: cat?.name ?? null,
      unit: p.unit as "gram" | "piece",
      unitPrice: Number(p.unit_price),
      stockOnHand: Number(p.stock_on_hand),
      imageUrl: p.image_url ?? null,
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t(locale, "ops.sellTitle")}
        </h1>
        <Link
          href={`/${clubSlug}/staff/operations/transactions`}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          {t(locale, "ops.transactionsLink")} →
        </Link>
      </div>
      <SellClient
        clubId={club.id}
        clubSlug={clubSlug}
        products={rows}
        initialMemberCode={initialMemberCode ?? null}
      />
    </div>
  );
}
