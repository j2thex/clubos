import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import Link from "next/link";
import { resolveRange, toIsoDate } from "@/lib/finance/range";
import {
  getFinanceRows,
  getFootTraffic,
  getChannelBreakdown,
  getProductsCostCoverage,
  summarize,
  dailyRevenueSeries,
  categoryBreakdown,
  topProducts,
} from "@/lib/finance/queries";
import { formatMoney, formatDelta } from "@/lib/i18n/currency";
import { t } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";
import { FinanceRangePicker } from "./finance-range-picker";
import { RevenueChart } from "./revenue-chart";
import { CategoryBreakdownChart } from "./category-breakdown-chart";
import { ExportFinanceButton } from "./export-button";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { clubSlug } = await params;
  const sp = await searchParams;
  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("id, operations_module_enabled")
    .eq("slug", clubSlug)
    .eq("active", true)
    .single();

  if (!club) notFound();
  if (!club.operations_module_enabled) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center text-gray-500 text-sm">
        Operations module not enabled for this club.
      </div>
    );
  }

  const locale = await getServerLocale();
  const range = resolveRange(sp);

  const [currentRows, previousRows, footTraffic, coverage] = await Promise.all([
    getFinanceRows(club.id, range.from, range.to),
    getFinanceRows(club.id, range.compareFrom, range.compareTo),
    getFootTraffic(club.id, range.from, range.to),
    getProductsCostCoverage(club.id),
  ]);
  const channelRows = await getChannelBreakdown(club.id, range.from, range.to, currentRows);

  const summary = summarize(currentRows, coverage.without, coverage.total);
  const previous = summarize(previousRows, 0, 0);
  const daily = dailyRevenueSeries(currentRows);
  const categories = categoryBreakdown(currentRows);
  const topByRevenue = topProducts(currentRows, "revenue", 10);
  const topByMargin = topProducts(currentRows, "margin", 10);

  const fromIso = toIsoDate(range.from);
  // to is exclusive in SQL but UI shows inclusive last day
  const toExclusive = new Date(range.to.getTime());
  const toIsoInclusive = toIsoDate(new Date(toExclusive.getTime() - 1));
  const toIsoExclusive = toExclusive.toISOString();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-gray-500 uppercase tracking-wide px-1">
          {t(locale, "finance.title")}
        </h1>
        <ExportFinanceButton
          clubId={club.id}
          fromIso={range.from.toISOString()}
          toIso={toIsoExclusive}
        />
      </div>

      <FinanceRangePicker current={range.preset} from={fromIso} to={toIsoInclusive} />

      {summary.productsWithoutCost > 0 && (
        <Link
          href={`/${clubSlug}/admin/products`}
          className="block rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
        >
          {t(locale, "finance.missingCostWarning", {
            count: summary.productsWithoutCost,
            total: summary.productsTotal,
          })}
        </Link>
      )}

      {/* Tiles */}
      <div className="grid grid-cols-2 gap-3">
        <Tile
          label={t(locale, "finance.gross")}
          value={formatMoney(summary.gross, "EUR", locale)}
          delta={formatDelta(summary.gross, previous.gross, locale)}
          sub={summary.voided > 0 ? t(locale, "finance.voidedSub", { amount: formatMoney(summary.voided, "EUR", locale) }) : null}
        />
        <Tile
          label={t(locale, "finance.margin")}
          value={formatMoney(summary.margin, "EUR", locale)}
          delta={formatDelta(summary.margin, previous.margin, locale)}
          sub={summary.marginPct !== null ? `${summary.marginPct.toFixed(1)}%` : null}
        />
        <Tile
          label={t(locale, "finance.footTraffic")}
          value={String(footTraffic.uniqueVisitors)}
          delta={null}
          sub={t(locale, "finance.totalEntries", { count: footTraffic.totalEntries })}
        />
        <Tile
          label={t(locale, "finance.newMembers")}
          value={String(
            channelRows.reduce((s, c) => s + c.newMembers, 0),
          )}
          delta={null}
          sub={t(locale, "finance.acrossChannels", { count: channelRows.length })}
        />
      </div>

      {/* Daily revenue */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">
          {t(locale, "finance.dailyRevenue")}
        </h2>
        <RevenueChart data={daily} />
      </div>

      {/* Category breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">
          {t(locale, "finance.byCategory")}
        </h2>
        <CategoryBreakdownChart data={categories} />
      </div>

      {/* Top products */}
      <div className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t(locale, "finance.topByRevenue")}
        </h2>
        <ProductList products={topByRevenue} locale={locale} showMarginPct={false} />
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t(locale, "finance.topByMargin")}
        </h2>
        <p className="text-xs text-gray-400">{t(locale, "finance.topByMarginHint")}</p>
        <ProductList products={topByMargin} locale={locale} showMarginPct={true} />
      </div>

      {/* Channel breakdown */}
      <div className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t(locale, "finance.byChannel")}
        </h2>
        {channelRows.length === 0 ? (
          <p className="text-sm text-gray-400">{t(locale, "finance.noChannels")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left font-semibold py-1">{t(locale, "finance.channelCol")}</th>
                <th className="text-right font-semibold py-1">{t(locale, "finance.newMembersCol")}</th>
                <th className="text-right font-semibold py-1">{t(locale, "finance.revenueCol")}</th>
              </tr>
            </thead>
            <tbody>
              {channelRows.map((c) => (
                <tr key={c.channel} className="border-t border-gray-100">
                  <td className="py-1.5 capitalize">{c.channel}</td>
                  <td className="py-1.5 text-right font-mono">{c.newMembers}</td>
                  <td className="py-1.5 text-right font-mono">
                    {formatMoney(c.gross, "EUR", locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  delta,
  sub,
}: {
  label: string;
  value: string;
  delta: string | null;
  sub: string | null;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {delta && delta !== "—" && (
        <p className="text-xs text-gray-500 mt-0.5">{delta}</p>
      )}
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function ProductList({
  products,
  locale,
  showMarginPct,
}: {
  products: Array<{
    product_id: string;
    product_name: string;
    category_name: string | null;
    qty: number;
    gross: number;
    margin: number;
    marginPct: number | null;
  }>;
  locale: "en" | "es";
  showMarginPct: boolean;
}) {
  if (products.length === 0) {
    return <p className="text-sm text-gray-400">—</p>;
  }
  return (
    <ul className="divide-y divide-gray-100">
      {products.map((p) => (
        <li key={p.product_id} className="py-2 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{p.product_name}</p>
            <p className="text-xs text-gray-400 truncate">{p.category_name ?? "—"}</p>
          </div>
          <div className="text-right ml-3 shrink-0">
            <p className="text-sm font-mono text-gray-900">
              {formatMoney(showMarginPct ? p.margin : p.gross, "EUR", locale)}
            </p>
            <p className="text-xs text-gray-400 font-mono">
              {showMarginPct && p.marginPct !== null
                ? `${p.marginPct.toFixed(1)}%`
                : `×${p.qty.toFixed(p.qty % 1 === 0 ? 0 : 1)}`}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
