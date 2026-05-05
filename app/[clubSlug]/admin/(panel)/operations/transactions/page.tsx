import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { t, getDateLocale } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { requireOpsAccess } from "@/lib/auth";
import { clubDayStartIso } from "@/lib/club-time";
import { VoidSaleButton } from "@/app/[clubSlug]/staff/(console)/operations/transactions/void-sale-button";
import { ExportCsvButton } from "@/app/[clubSlug]/staff/(console)/operations/transactions/export-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

function toDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function AdminOperationsTransactionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ page?: string; memberCode?: string }>;
}) {
  const { clubSlug } = await params;
  const { page: pageRaw, memberCode: memberCodeRaw } = await searchParams;
  const page = Math.max(0, Number(pageRaw ?? 0) || 0);
  const memberCode = memberCodeRaw?.trim() || null;
  const supabase = createAdminClient();
  const locale = await getServerLocale();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, timezone")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();

  await requireOpsAccess(club.id, "transactions");

  let filterMember: { member_code: string; full_name: string | null } | null =
    null;
  if (memberCode) {
    const { data } = await supabase
      .from("members")
      .select("member_code, full_name")
      .eq("club_id", club.id)
      .eq("member_code", memberCode)
      .maybeSingle();
    filterMember = data ?? null;
  }

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const dayStart = clubDayStartIso(new Date(), club.timezone ?? "Europe/Madrid");

  const salesQuery = memberCode
    ? supabase
        .from("sales")
        .select(
          "id, total, discount, paid_with, comment, created_at, voided_at, void_reason, members!inner(member_code, full_name), staff:fulfilled_by(member_code, full_name), lines:product_transactions(id, quantity, unit_price_at_sale, total_price, weight_source, products(name, unit))",
          { count: "exact" },
        )
        .eq("club_id", club.id)
        .eq("members.member_code", memberCode)
        .order("created_at", { ascending: false })
        .range(from, to)
    : supabase
        .from("sales")
        .select(
          "id, total, discount, paid_with, comment, created_at, voided_at, void_reason, members(member_code, full_name), staff:fulfilled_by(member_code, full_name), lines:product_transactions(id, quantity, unit_price_at_sale, total_price, weight_source, products(name, unit))",
          { count: "exact" },
        )
        .eq("club_id", club.id)
        .order("created_at", { ascending: false })
        .range(from, to);

  const [
    { data: sales, count },
    { data: totals },
    { data: voidedToday },
    { data: todayLines },
  ] = await Promise.all([
    salesQuery,
    memberCode
      ? Promise.resolve({ data: null })
      : supabase
          .from("sales")
          .select("total")
          .eq("club_id", club.id)
          .is("voided_at", null)
          .gte("created_at", dayStart),
    memberCode
      ? Promise.resolve({ data: null })
      : supabase
          .from("sales")
          .select("total")
          .eq("club_id", club.id)
          .not("voided_at", "is", null)
          .gte("voided_at", dayStart),
    !memberCode && page === 0
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

  // Group sales by local-day so the list shows day headers with per-day totals.
  const dayLocale = getDateLocale(locale);
  const todayKey = toDayKey(new Date());
  const yesterdayKey = toDayKey(new Date(Date.now() - 86400000));
  function dayLabel(key: string, sample: Date): string {
    if (key === todayKey) return t(locale, "ops.tx.dayToday");
    if (key === yesterdayKey) return t(locale, "ops.tx.dayYesterday");
    return sample.toLocaleDateString(dayLocale, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }
  type SaleRow = NonNullable<typeof sales>[number];
  const groups: Array<{ key: string; label: string; total: number; count: number; sales: SaleRow[] }> = [];
  for (const sale of sales ?? []) {
    const created = new Date(sale.created_at);
    const key = toDayKey(created);
    let group = groups.length > 0 && groups[groups.length - 1].key === key
      ? groups[groups.length - 1]
      : null;
    if (!group) {
      group = { key, label: dayLabel(key, created), total: 0, count: 0, sales: [] };
      groups.push(group);
    }
    group.sales.push(sale);
  }

  // Per-day totals must reflect the WHOLE day, not just the rows on this page.
  // Re-query non-voided sales for the full date range covering the visible days
  // and aggregate by day-key.
  if (groups.length > 0) {
    const newestKey = groups[0].key;
    const oldestKey = groups[groups.length - 1].key;
    const oldestStart = new Date(`${oldestKey}T00:00:00`).toISOString();
    const newestEnd = new Date(`${newestKey}T00:00:00`);
    newestEnd.setDate(newestEnd.getDate() + 1);
    const { data: dayRows } = memberCode
      ? await supabase
          .from("sales")
          .select("created_at, total, members!inner(member_code)")
          .eq("club_id", club.id)
          .eq("members.member_code", memberCode)
          .is("voided_at", null)
          .gte("created_at", oldestStart)
          .lt("created_at", newestEnd.toISOString())
      : await supabase
          .from("sales")
          .select("created_at, total")
          .eq("club_id", club.id)
          .is("voided_at", null)
          .gte("created_at", oldestStart)
          .lt("created_at", newestEnd.toISOString());
    const totalsByKey = new Map<string, { total: number; count: number }>();
    for (const row of dayRows ?? []) {
      const key = toDayKey(new Date(row.created_at));
      const existing = totalsByKey.get(key) ?? { total: 0, count: 0 };
      existing.total += Number(row.total);
      existing.count += 1;
      totalsByKey.set(key, existing);
    }
    for (const group of groups) {
      const t = totalsByKey.get(group.key);
      if (t) {
        group.total = t.total;
        group.count = t.count;
      }
    }
  }

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

      {memberCode ? (
        <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {filterMember?.full_name
                ? `${filterMember.member_code} · ${filterMember.full_name}`
                : t(locale, "ops.tx.filteredBy", { code: memberCode })}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 tabular-nums">
              {t(locale, "ops.tx.salesCount", { count: totalCount })}
            </p>
          </div>
          <Link
            href={`/${clubSlug}/admin/operations/transactions`}
            className="text-xs rounded-full px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 shrink-0"
          >
            {t(locale, "ops.tx.clearFilter")}
          </Link>
        </div>
      ) : (
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
      )}

      {!memberCode && productSummaryRows.length > 0 && (
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

      {totalCount === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-400 text-sm">
          {t(locale, "ops.tx.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.key}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="px-5 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  {group.label}
                </p>
                <p className="text-[11px] text-gray-500 tabular-nums">
                  {t(locale, "ops.tx.dayRevenue", {
                    total: group.total.toFixed(2),
                    count: group.count,
                  })}
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {group.sales.map((sale) => {
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
                        {member?.member_code ? (
                          <Link
                            href={`/${clubSlug}/admin/operations/transactions?memberCode=${encodeURIComponent(member.member_code)}`}
                            className="hover:underline"
                          >
                            {member.member_code}
                            {member.full_name ? ` · ${member.full_name}` : ""}
                          </Link>
                        ) : (
                          "?"
                        )}
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
            </div>
          ))}
        </div>
      )}

      {totalCount > PAGE_SIZE && (
        <div className="flex gap-2 justify-center">
          {page > 0 && (
            <Link
              href={`/${clubSlug}/admin/operations/transactions?${new URLSearchParams({
                ...(memberCode ? { memberCode } : {}),
                page: String(page - 1),
              }).toString()}`}
              className="text-xs rounded-full px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              {t(locale, "ops.tx.newer")}
            </Link>
          )}
          {from + PAGE_SIZE < totalCount && (
            <Link
              href={`/${clubSlug}/admin/operations/transactions?${new URLSearchParams({
                ...(memberCode ? { memberCode } : {}),
                page: String(page + 1),
              }).toString()}`}
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
