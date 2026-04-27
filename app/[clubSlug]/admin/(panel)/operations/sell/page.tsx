import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { requireOpsAccess } from "@/lib/auth";
import {
  SellClient,
  type SellCategory,
  type SellProduct,
} from "@/app/[clubSlug]/staff/(console)/operations/sell/sell-client";
import {
  lookupMemberForSell,
  type MemberForSell,
} from "@/app/[clubSlug]/staff/(console)/operations/sell/actions";

export const dynamic = "force-dynamic";

export default async function AdminOperationsSellPage({
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
    .select("id, currency_mode")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  await requireOpsAccess(club.id, "sell");

  const currencyMode = (club.currency_mode as "saldo" | "cash") ?? "cash";

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("product_categories")
      .select("id, name, name_es, display_order")
      .eq("club_id", club.id)
      .eq("archived", false)
      .order("display_order", { ascending: true }),
    supabase
      .from("products")
      .select(
        "id, name, name_es, unit, unit_price, stock_on_hand, image_url, display_order, category_id",
      )
      .eq("club_id", club.id)
      .eq("archived", false)
      .eq("active", true)
      .order("display_order", { ascending: true }),
  ]);

  const categoryRows: SellCategory[] = (categories ?? []).map((c) => ({
    id: c.id,
    name: locale === "es" && c.name_es ? c.name_es : c.name,
  }));

  const productRows: SellProduct[] = (products ?? []).map((p) => ({
    id: p.id,
    categoryId: p.category_id,
    name: locale === "es" && p.name_es ? p.name_es : p.name,
    unit: p.unit as "gram" | "piece",
    unitPrice: Number(p.unit_price),
    stockOnHand: Number(p.stock_on_hand),
    imageUrl: p.image_url ?? null,
  }));

  let initialMember: MemberForSell | null = null;
  if (initialMemberCode) {
    const lookup = await lookupMemberForSell(club.id, initialMemberCode);
    if ("ok" in lookup) initialMember = lookup.data;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t(locale, "ops.sellTitle")}
        </h1>
        <Link
          href={`/${clubSlug}/admin/operations/transactions`}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          {t(locale, "ops.transactionsLink")} →
        </Link>
      </div>
      <SellClient
        clubId={club.id}
        clubSlug={clubSlug}
        currencyMode={currencyMode}
        canDoTopup={true}
        categories={categoryRows}
        products={productRows}
        initialMember={initialMember}
      />
    </div>
  );
}
