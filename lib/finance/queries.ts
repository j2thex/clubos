import { createAdminClient } from "@/lib/supabase/admin";

export interface FinanceRow {
  day: string;
  category_id: string | null;
  category_name: string | null;
  product_id: string;
  product_name: string;
  qty: number;
  gross: number;
  cost: number;
  voided_gross: number;
}

export interface FinanceSummary {
  gross: number;
  net: number;
  cost: number;
  margin: number;
  marginPct: number | null;
  voided: number;
  productsWithoutCost: number;
  productsTotal: number;
}

export interface DailyRevenuePoint {
  day: string;
  gross: number;
  cost: number;
}

export interface CategoryBreakdownRow {
  category_id: string | null;
  category_name: string;
  gross: number;
  cost: number;
  margin: number;
  qty: number;
}

export interface TopProductRow {
  product_id: string;
  product_name: string;
  category_name: string | null;
  qty: number;
  gross: number;
  margin: number;
  marginPct: number | null;
}

export interface ChannelRow {
  channel: string;
  newMembers: number;
  gross: number;
}

export interface FootTraffic {
  uniqueVisitors: number;
  totalEntries: number;
}

function n(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(num) ? num : 0;
}

export async function getFinanceRows(
  clubId: string,
  from: Date,
  to: Date,
): Promise<FinanceRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("finance_summary", {
    p_club_id: clubId,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    day: String(row.day),
    category_id: (row.category_id as string | null) ?? null,
    category_name: (row.category_name as string | null) ?? null,
    product_id: String(row.product_id),
    product_name: String(row.product_name),
    qty: n(row.qty),
    gross: n(row.gross),
    cost: n(row.cost),
    voided_gross: n(row.voided_gross),
  }));
}

export async function getFootTraffic(
  clubId: string,
  from: Date,
  to: Date,
): Promise<FootTraffic> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("club_entries")
    .select("member_id")
    .eq("club_id", clubId)
    .gte("checked_in_at", from.toISOString())
    .lt("checked_in_at", to.toISOString());
  if (error) throw error;
  const memberIds = new Set((data ?? []).map((r) => r.member_id));
  return {
    uniqueVisitors: memberIds.size,
    totalEntries: data?.length ?? 0,
  };
}

export async function getChannelBreakdown(
  clubId: string,
  from: Date,
  to: Date,
  rows: FinanceRow[],
): Promise<ChannelRow[]> {
  const supabase = createAdminClient();

  // New members in the period with a channel set.
  const { data: newMembers } = await supabase
    .from("members")
    .select("id, marketing_channel, created_at")
    .eq("club_id", clubId)
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString())
    .not("marketing_channel", "is", null);

  // Revenue attribution: all members with a channel, then join to transactions in the range.
  const { data: txForChannels } = await supabase
    .from("product_transactions")
    .select("total_price, voided_at, members!product_transactions_member_id_fkey(marketing_channel)")
    .eq("club_id", clubId)
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString())
    .is("voided_at", null);

  const channelCounts = new Map<string, number>();
  const channelRevenue = new Map<string, number>();

  for (const m of newMembers ?? []) {
    const ch = (m.marketing_channel as string).trim().toLowerCase();
    if (!ch) continue;
    channelCounts.set(ch, (channelCounts.get(ch) ?? 0) + 1);
  }

  for (const tx of txForChannels ?? []) {
    const memberObj = Array.isArray(tx.members) ? tx.members[0] : tx.members;
    const ch = memberObj?.marketing_channel?.trim().toLowerCase();
    if (!ch) continue;
    channelRevenue.set(ch, (channelRevenue.get(ch) ?? 0) + n(tx.total_price));
  }

  const all = new Set([...channelCounts.keys(), ...channelRevenue.keys()]);
  // Silences the unused-var warning if caller doesn't use `rows`; keeps the signature open for
  // future enhancements that cross-reference transaction rows per channel.
  void rows;
  return [...all]
    .map((channel) => ({
      channel,
      newMembers: channelCounts.get(channel) ?? 0,
      gross: channelRevenue.get(channel) ?? 0,
    }))
    .sort((a, b) => b.gross - a.gross || b.newMembers - a.newMembers);
}

export function summarize(
  rows: FinanceRow[],
  productsWithoutCost: number,
  productsTotal: number,
): FinanceSummary {
  let gross = 0;
  let cost = 0;
  let voided = 0;
  for (const r of rows) {
    gross += r.gross;
    cost += r.cost;
    voided += r.voided_gross;
  }
  const margin = gross - cost;
  const marginPct = gross > 0 ? (margin / gross) * 100 : null;
  return {
    gross,
    net: gross, // voids already excluded from gross in the RPC
    cost,
    margin,
    marginPct,
    voided,
    productsWithoutCost,
    productsTotal,
  };
}

export function dailyRevenueSeries(rows: FinanceRow[]): DailyRevenuePoint[] {
  const byDay = new Map<string, { gross: number; cost: number }>();
  for (const r of rows) {
    const bucket = byDay.get(r.day) ?? { gross: 0, cost: 0 };
    bucket.gross += r.gross;
    bucket.cost += r.cost;
    byDay.set(r.day, bucket);
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, v]) => ({ day, gross: v.gross, cost: v.cost }));
}

export function categoryBreakdown(rows: FinanceRow[]): CategoryBreakdownRow[] {
  const byCat = new Map<string, CategoryBreakdownRow>();
  for (const r of rows) {
    const key = r.category_id ?? "__none__";
    const existing = byCat.get(key);
    if (existing) {
      existing.gross += r.gross;
      existing.cost += r.cost;
      existing.margin += r.gross - r.cost;
      existing.qty += r.qty;
    } else {
      byCat.set(key, {
        category_id: r.category_id,
        category_name: r.category_name ?? "Uncategorized",
        gross: r.gross,
        cost: r.cost,
        margin: r.gross - r.cost,
        qty: r.qty,
      });
    }
  }
  return [...byCat.values()].sort((a, b) => b.gross - a.gross);
}

export function topProducts(
  rows: FinanceRow[],
  by: "revenue" | "margin",
  limit = 10,
  minGross = 50,
): TopProductRow[] {
  const byProduct = new Map<string, TopProductRow>();
  for (const r of rows) {
    const existing = byProduct.get(r.product_id);
    if (existing) {
      existing.qty += r.qty;
      existing.gross += r.gross;
      existing.margin += r.gross - r.cost;
    } else {
      byProduct.set(r.product_id, {
        product_id: r.product_id,
        product_name: r.product_name,
        category_name: r.category_name,
        qty: r.qty,
        gross: r.gross,
        margin: r.gross - r.cost,
        marginPct: null,
      });
    }
  }
  const list = [...byProduct.values()].map((p) => ({
    ...p,
    marginPct: p.gross > 0 ? (p.margin / p.gross) * 100 : null,
  }));
  const filtered = by === "margin" ? list.filter((p) => p.gross >= minGross) : list;
  return filtered
    .sort((a, b) => (by === "revenue" ? b.gross - a.gross : b.margin - a.margin))
    .slice(0, limit);
}

export async function getProductsCostCoverage(
  clubId: string,
): Promise<{ without: number; total: number }> {
  const supabase = createAdminClient();
  const [{ count: total }, { count: without }] = await Promise.all([
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("archived", false),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("archived", false)
      .or("cost_price.is.null,cost_price.eq.0"),
  ]);
  return { without: without ?? 0, total: total ?? 0 };
}
