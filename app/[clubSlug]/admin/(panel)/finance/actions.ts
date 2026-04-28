"use server";

import { requireOwnerForOpsClub } from "@/lib/auth";
import { getFinanceRows } from "@/lib/finance/queries";

export async function exportFinanceRangeCsv(
  clubId: string,
  fromIso: string,
  toIso: string,
): Promise<{ error: string } | { ok: true; csv: string; filename: string }> {
  try {
    await requireOwnerForOpsClub(clubId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unauthorized" };
  }

  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { error: "Invalid range" };
  }

  const rows = await getFinanceRows(clubId, from, to);

  const header = [
    "day",
    "category",
    "product",
    "qty",
    "gross_eur",
    "cost_eur",
    "margin_eur",
    "voided_eur",
  ];
  const csvRows = [header.join(",")];
  for (const r of rows) {
    csvRows.push(
      [
        r.day,
        JSON.stringify(r.category_name ?? ""),
        JSON.stringify(r.product_name),
        r.qty.toFixed(3),
        r.gross.toFixed(2),
        r.cost.toFixed(2),
        (r.gross - r.cost).toFixed(2),
        r.voided_gross.toFixed(2),
      ].join(","),
    );
  }

  const fromStr = from.toISOString().slice(0, 10);
  const toStr = new Date(to.getTime() - 1).toISOString().slice(0, 10);
  return {
    ok: true,
    csv: csvRows.join("\n"),
    filename: `finance-${fromStr}-to-${toStr}.csv`,
  };
}
