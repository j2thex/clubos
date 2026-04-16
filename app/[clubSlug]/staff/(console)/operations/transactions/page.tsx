import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { t, getDateLocale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { VoidButton } from "./void-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function StaffOperationsTransactionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { clubSlug } = await params;
  const { page: pageRaw } = await searchParams;
  const page = Math.max(0, Number(pageRaw ?? 0) || 0);
  const supabase = createAdminClient();
  const locale = await getServerLocale();

  const { data: club } = await supabase
    .from("clubs")
    .select("id")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const dayStart = new Date(new Date().toDateString()).toISOString();

  const [
    { data: txs, count },
    { data: totals },
    { data: voidedToday },
    { data: todayRows },
  ] = await Promise.all([
    supabase
      .from("product_transactions")
      .select(
        "id, quantity, unit_price_at_sale, total_price, weight_source, scale_raw_reading, created_at, voided_at, void_reason, members(member_code, full_name), products(name, unit), staff:fulfilled_by(member_code, full_name)",
        { count: "exact" },
      )
      .eq("club_id", club.id)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("product_transactions")
      .select("total_price")
      .eq("club_id", club.id)
      .is("voided_at", null)
      .gte("created_at", dayStart),
    supabase
      .from("product_transactions")
      .select("total_price")
      .eq("club_id", club.id)
      .not("voided_at", "is", null)
      .gte("voided_at", dayStart),
    page === 0
      ? supabase
          .from("product_transactions")
          .select("quantity, total_price, products(name, unit)")
          .eq("club_id", club.id)
          .is("voided_at", null)
          .gte("created_at", dayStart)
      : Promise.resolve({ data: null }),
  ]);

  const todayTotal = (totals ?? []).reduce(
    (s, r) => s + Number(r.total_price),
    0,
  );
  const voidedTotal = (voidedToday ?? []).reduce(
    (s, r) => s + Number(r.total_price),
    0,
  );
  const voidedCount = voidedToday?.length ?? 0;

  // Group today's sales by product for the per-product summary block.
  const productSummary = new Map<
    string,
    { qty: number; revenue: number; unit: "gram" | "piece" }
  >();
  for (const row of todayRows ?? []) {
    const prod = Array.isArray(row.products) ? row.products[0] : row.products;
    if (!prod) continue;
    const key = prod.name;
    const existing = productSummary.get(key) ?? {
      qty: 0,
      revenue: 0,
      unit: prod.unit as "gram" | "piece",
    };
    existing.qty += Number(row.quantity);
    existing.revenue += Number(row.total_price);
    productSummary.set(key, existing);
  }
  const productSummaryRows = Array.from(productSummary.entries()).sort(
    (a, b) => b[1].revenue - a[1].revenue,
  );

  const totalCount = count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h1 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t(locale, "ops.transactionsTitle")}
        </h1>
        <Link
          href={`/${clubSlug}/staff/operations/sell`}
          className="text-xs text-gray-500 hover:text-gray-900"
        >
          ← {t(locale, "ops.sellLink")}
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-5 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wide">
          {t(locale, "ops.tx.todayRevenue")}
        </p>
        <p className="text-3xl font-bold text-gray-900 mt-1">
          {todayTotal.toFixed(2)} €
        </p>
        {voidedCount > 0 && (
          <p className="text-[11px] text-gray-500 mt-2">
            {t(locale, "ops.tx.voidedToday", {
              count: voidedCount,
              total: voidedTotal.toFixed(2),
            })}
          </p>
        )}
      </div>

      {productSummaryRows.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t(locale, "ops.tx.summary")}
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {productSummaryRows.map(([name, row]) => (
              <div
                key={name}
                className="px-5 py-2 flex items-center justify-between gap-3"
              >
                <p className="text-sm text-gray-900 truncate flex-1">{name}</p>
                <p className="text-xs text-gray-500 shrink-0 tabular-nums">
                  {row.qty.toFixed(row.unit === "gram" ? 1 : 0)}
                  {row.unit === "gram" ? "g" : ""}
                </p>
                <p className="text-sm font-semibold text-gray-900 shrink-0 tabular-nums w-16 text-right">
                  {row.revenue.toFixed(2)} €
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {totalCount === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {t(locale, "ops.tx.empty")}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(txs ?? []).map((tx) => {
              const member = Array.isArray(tx.members)
                ? tx.members[0]
                : tx.members;
              const product = Array.isArray(tx.products)
                ? tx.products[0]
                : tx.products;
              const staffRef = Array.isArray(tx.staff)
                ? tx.staff[0]
                : tx.staff;
              const when = new Date(tx.created_at).toLocaleString(
                getDateLocale(locale),
                { dateStyle: "short", timeStyle: "short" },
              );
              const voided = !!tx.voided_at;
              return (
                <div
                  key={tx.id}
                  className={`px-5 py-3 flex items-center gap-3 ${
                    voided ? "opacity-60 line-through" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {product?.name ?? "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Number(tx.quantity).toFixed(
                        product?.unit === "gram" ? 1 : 0,
                      )}
                      {product?.unit === "gram" ? "g" : ""} ·{" "}
                      {member?.member_code ?? "?"}
                      {tx.weight_source === "scale" ? ` · ${t(locale, "ops.tx.scale")}` : ""}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {when}
                      {staffRef?.member_code
                        ? ` · ${t(locale, "ops.tx.staffColumn", { code: staffRef.member_code })}`
                        : ""}
                      {voided && tx.void_reason
                        ? ` · ${t(locale, "ops.tx.voidedBy", { reason: tx.void_reason })}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {Number(tx.total_price).toFixed(2)} €
                    </p>
                    {!voided && (
                      <VoidButton
                        transactionId={tx.id}
                        clubSlug={clubSlug}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {totalCount > PAGE_SIZE && (
        <div className="flex gap-2 justify-center">
          {page > 0 && (
            <Link
              href={`/${clubSlug}/staff/operations/transactions?page=${page - 1}`}
              className="text-xs rounded-full px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {t(locale, "ops.tx.newer")}
            </Link>
          )}
          {from + PAGE_SIZE < totalCount && (
            <Link
              href={`/${clubSlug}/staff/operations/transactions?page=${page + 1}`}
              className="text-xs rounded-full px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {t(locale, "ops.tx.older")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
