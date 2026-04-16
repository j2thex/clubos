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

  const [{ data: txs, count }, { data: totals }] = await Promise.all([
    supabase
      .from("product_transactions")
      .select(
        "id, quantity, unit_price_at_sale, total_price, weight_source, scale_raw_reading, created_at, voided_at, void_reason, members(member_code, full_name), products(name, unit)",
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
      .gte("created_at", new Date(new Date().toDateString()).toISOString()),
  ]);

  const todayTotal = (totals ?? []).reduce(
    (s, r) => s + Number(r.total_price),
    0,
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
      </div>

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
