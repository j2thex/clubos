import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { t, getDateLocale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { requireOpsAccess } from "@/lib/auth";
import { VoidSaleButton } from "@/app/[clubSlug]/staff/(console)/operations/transactions/void-sale-button";
import { ExportCsvButton } from "@/app/[clubSlug]/staff/(console)/operations/transactions/export-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminOperationsTransactionsPage({
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

  await requireOpsAccess(club.id, "transactions");

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const dayStart = new Date(new Date().toDateString()).toISOString();

  const [
    { data: sales, count },
    { data: totals },
    { data: voidedToday },
    { data: todayLines },
  ] = await Promise.all([
    supabase
      .from("sales")
      .select(
        "id, total, discount, paid_with, comment, created_at, voided_at, void_reason, members(member_code, full_name), staff:fulfilled_by(member_code, full_name), lines:product_transactions(id, quantity, unit_price_at_sale, total_price, weight_source, products(name, unit))",
        { count: "exact" },
      )
      .eq("club_id", club.id)
      .order("created_at", { ascending: false })
      .range(from, to),
    supabase
      .from("sales")
      .select("total")
      .eq("club_id", club.id)
      .is("voided_at", null)
      .gte("created_at", dayStart),
    supabase
      .from("sales")
      .select("total")
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
    (s, r) => s + Number(r.total),
    0,
  );
  const voidedTotal = (voidedToday ?? []).reduce(
    (s, r) => s + Number(r.total),
    0,
  );
  const voidedCount = voidedToday?.length ?? 0;

  const productSummary = new Map<
    string,
    { qty: number; revenue: number; unit: "gram" | "piece" }
  >();
  for (const row of todayLines ?? []) {
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
        <div className="flex items-center gap-3">
          <ExportCsvButton clubId={club.id} />
          <Link
            href={`/${clubSlug}/admin/operations/sell`}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            ← {t(locale, "ops.sellLink")}
          </Link>
        </div>
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
            {(sales ?? []).map((sale) => {
              const member = Array.isArray(sale.members)
                ? sale.members[0]
                : sale.members;
              const staffRef = Array.isArray(sale.staff)
                ? sale.staff[0]
                : sale.staff;
              const when = new Date(sale.created_at).toLocaleString(
                getDateLocale(locale),
                { dateStyle: "short", timeStyle: "short" },
              );
              const voided = !!sale.voided_at;
              const lines = (sale.lines ?? []) as Array<{
                id: string;
                quantity: number;
                unit_price_at_sale: number;
                total_price: number;
                weight_source: "manual" | "scale";
                products:
                  | { name: string; unit: "gram" | "piece" }
                  | { name: string; unit: "gram" | "piece" }[]
                  | null;
              }>;
              const discount = Number(sale.discount);
              return (
                <div
                  key={sale.id}
                  className={`px-5 py-3 ${voided ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold text-gray-900 ${voided ? "line-through" : ""}`}>
                        {member?.member_code ?? "?"}
                        {member?.full_name ? ` · ${member.full_name}` : ""}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {when}
                        {staffRef?.member_code
                          ? ` · ${t(locale, "ops.tx.staffColumn", { code: staffRef.member_code })}`
                          : ""}
                        {voided && sale.void_reason
                          ? ` · ${t(locale, "ops.tx.voidedBy", { reason: sale.void_reason })}`
                          : ""}
                      </p>
                      {sale.comment && (
                        <p className="text-[11px] text-gray-500 mt-0.5 italic">
                          {sale.comment}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold text-gray-900 tabular-nums ${voided ? "line-through" : ""}`}>
                        {Number(sale.total).toFixed(2)} €
                      </p>
                      <p className="text-[10px] uppercase text-gray-400 mt-0.5">
                        {sale.paid_with}
                      </p>
                      {!voided && (
                        <div className="mt-1">
                          <VoidSaleButton saleId={sale.id} clubSlug={clubSlug} />
                        </div>
                      )}
                    </div>
                  </div>
                  {lines.length > 0 && (
                    <div className="mt-2 pl-3 border-l-2 border-gray-100 space-y-0.5">
                      {lines.map((l) => {
                        const prod = Array.isArray(l.products) ? l.products[0] : l.products;
                        return (
                          <div
                            key={l.id}
                            className={`flex items-center justify-between gap-2 text-[11px] tabular-nums ${voided ? "line-through" : ""}`}
                          >
                            <span className="text-gray-700 truncate flex-1">
                              {Number(l.quantity).toFixed(prod?.unit === "gram" ? 1 : 0)}
                              {prod?.unit === "gram" ? "g" : "×"} {prod?.name ?? "—"}
                              {l.weight_source === "scale"
                                ? ` · ${t(locale, "ops.tx.scale")}`
                                : ""}
                            </span>
                            <span className="text-gray-500 shrink-0">
                              {Number(l.unit_price_at_sale).toFixed(2)} €/
                              {prod?.unit === "gram" ? "g" : "ea"}
                            </span>
                            <span className="text-gray-900 font-semibold shrink-0 w-14 text-right">
                              {Number(l.total_price).toFixed(2)} €
                            </span>
                          </div>
                        );
                      })}
                      {discount > 0 && (
                        <div className={`flex items-center justify-between gap-2 text-[11px] tabular-nums text-amber-700 ${voided ? "line-through" : ""}`}>
                          <span>{t(locale, "ops.sell.discount").replace(" (€)", "")}</span>
                          <span>−{discount.toFixed(2)} €</span>
                        </div>
                      )}
                    </div>
                  )}
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
              href={`/${clubSlug}/admin/operations/transactions?page=${page - 1}`}
              className="text-xs rounded-full px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {t(locale, "ops.tx.newer")}
            </Link>
          )}
          {from + PAGE_SIZE < totalCount && (
            <Link
              href={`/${clubSlug}/admin/operations/transactions?page=${page + 1}`}
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
