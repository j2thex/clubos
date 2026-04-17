"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { lookupMemberForEntry, type LookedUpMember } from "../entry/actions";
import { sellProduct } from "./actions";
import { ScalePanel } from "@/components/club/scale-panel";

const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false, loading: () => <div className="aspect-square w-full rounded-2xl bg-gray-900" /> },
);

export type SellProduct = {
  id: string;
  name: string;
  nameEs: string | null;
  categoryName: string | null;
  unit: "gram" | "piece";
  unitPrice: number;
  stockOnHand: number;
  imageUrl: string | null;
};

type PickerMode = "idle" | "scanning" | "manual";

type Receipt = {
  transactionId: string;
  productName: string;
  total: number;
};

export function SellClient({
  clubId,
  clubSlug,
  products,
}: {
  clubId: string;
  clubSlug: string;
  products: SellProduct[];
}) {
  const { t } = useLanguage();
  const [pickerMode, setPickerMode] = useState<PickerMode>("idle");
  const [manualCode, setManualCode] = useState("");
  const [member, setMember] = useState<LookedUpMember | null>(null);
  const [productId, setProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [scaleReading, setScaleReading] = useState<{
    raw: string;
  } | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const product = products.find((p) => p.id === productId) ?? null;
  const qty = Number(quantity);
  const qtyValid = Number.isFinite(qty) && qty > 0;
  const inStock = product ? product.stockOnHand >= qty : true;
  const total =
    product && qtyValid ? Math.round(product.unitPrice * qty * 100) / 100 : 0;

  function resolveCode(raw: string) {
    startTransition(async () => {
      const r = await lookupMemberForEntry(clubId, raw);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      setMember(r.member);
      setPickerMode("idle");
      setManualCode("");
    });
  }

  function handleConfirm() {
    if (!member || !product || receipt) return;
    const soldProductName = product.name;
    const soldProductId = product.id;
    const soldTotal = total;
    startTransition(async () => {
      const r = await sellProduct(clubSlug, {
        clubId,
        productId: soldProductId,
        memberId: member.id,
        quantity: qty,
        weightSource: scaleReading ? "scale" : "manual",
        scaleRawReading: scaleReading?.raw ?? null,
      });
      if ("error" in r) {
        // Keep inputs intact so staff can retry without re-picking product.
        toast.error(r.error);
        return;
      }
      // Show in-page receipt. Do NOT clear form to "idle" on auto-close —
      // require an explicit "New sale" click to avoid double-submission
      // from a second tap during network lag.
      setReceipt({
        transactionId: r.transactionId,
        productName: soldProductName,
        total: soldTotal,
      });
      setRecent((cur) => {
        const next = [soldProductId, ...cur.filter((id) => id !== soldProductId)];
        return next.slice(0, 3);
      });
    });
  }

  function startNewSale() {
    setReceipt(null);
    setMember(null);
    setProductId("");
    setQuantity("");
    setScaleReading(null);
  }

  // When the receipt is showing, everything below step 1 is locked.
  const locked = isPending || !!receipt;
  const recentProducts = recent
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is SellProduct => !!p && p.stockOnHand > 0);

  return (
    <div className="space-y-4">
      {/* Step 1 — member */}
      <section className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">{t("ops.sell.step1")}</p>
          {member && !receipt && (
            <button
              type="button"
              onClick={() => setMember(null)}
              className="text-xs text-gray-500 hover:text-gray-900"
            >
              {t("ops.sell.change")}
            </button>
          )}
        </div>
        {member ? (
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-mono font-semibold text-gray-900 text-sm">
                  {member.memberCode}
                </p>
                {member.fullName && (
                  <p className="text-xs text-gray-500 truncate">{member.fullName}</p>
                )}
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {member.age !== null && (
                    <span
                      className={`text-[10px] rounded-full px-2 py-0.5 ${
                        member.age < 21
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {t("ops.entry.age", { age: member.age })}
                    </span>
                  )}
                  {member.idVerifiedAt ? (
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-green-100 text-green-700 font-semibold">
                      {t("ops.sell.verified")}
                    </span>
                  ) : (
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-amber-100 text-amber-800">
                      {t("ops.sell.notVerified")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!member.idVerifiedAt && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                {t("ops.sell.unverifiedBanner")}
              </div>
            )}
          </div>
        ) : pickerMode === "scanning" ? (
          <div className="relative">
            <Scanner
              onScan={(results) => {
                const first = results[0]?.rawValue;
                if (first) resolveCode(first);
              }}
              onError={(err) => {
                toast.error(err instanceof Error ? err.message : t("ops.scale.connectFailed"));
                setPickerMode("idle");
              }}
              constraints={{ facingMode: "environment" }}
              allowMultiple={false}
              scanDelay={400}
              styles={{ container: { aspectRatio: "1 / 1" } }}
            />
            <button
              type="button"
              onClick={() => setPickerMode("idle")}
              className="absolute top-3 right-3 rounded-full bg-black/60 text-white text-xs font-semibold px-3 py-1.5 hover:bg-black/80"
            >
              {t("ops.sell.cancel")}
            </button>
          </div>
        ) : pickerMode === "manual" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) resolveCode(manualCode.trim());
            }}
            className="p-4 space-y-2"
          >
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder={t("ops.memberForm.codePlaceholder")}
              maxLength={8}
              autoFocus
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base font-mono uppercase tracking-wide"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isPending || !manualCode.trim()}
                className="flex-1 rounded-lg bg-gray-800 text-white text-sm font-semibold py-2 disabled:opacity-50"
              >
                {isPending ? "…" : t("ops.sell.find")}
              </button>
              <button
                type="button"
                onClick={() => setPickerMode("idle")}
                className="rounded-lg border border-gray-300 text-sm font-semibold text-gray-600 px-4 py-2"
              >
                {t("ops.sell.cancel")}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 space-y-2">
            <button
              type="button"
              onClick={() => setPickerMode("scanning")}
              className="w-full rounded-lg bg-gray-800 text-white text-sm font-semibold py-3"
            >
              {t("ops.sell.scanQr")}
            </button>
            <button
              type="button"
              onClick={() => setPickerMode("manual")}
              className="w-full rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 py-3"
            >
              {t("ops.sell.enterManually")}
            </button>
          </div>
        )}
      </section>

      {/* Receipt panel — shown after a successful sale */}
      {receipt && (
        <section className="bg-green-50 border border-green-200 rounded-2xl p-5 space-y-3">
          <p className="text-sm text-green-900">
            {t("ops.sell.sold", {
              id: receipt.transactionId.slice(-8).toUpperCase(),
              total: receipt.total.toFixed(2),
            })}
          </p>
          <p className="text-xs text-green-800">{receipt.productName}</p>
          <button
            type="button"
            onClick={startNewSale}
            className="w-full rounded-lg bg-green-700 text-white text-sm font-semibold py-2 hover:bg-green-800"
          >
            {t("ops.sell.newSale")}
          </button>
        </section>
      )}

      {/* Step 2 — product */}
      <section
        className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
          !member || locked ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">{t("ops.sell.step2")}</p>
        </div>
        {products.length === 0 ? (
          <div className="p-4 text-xs text-gray-500">{t("ops.sell.emptyProducts")}</div>
        ) : (
          <>
            {recentProducts.length > 0 && (
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  {t("ops.sell.recent")}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {recentProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProductId(p.id)}
                      className={`text-xs rounded-full px-3 py-1 font-semibold ${
                        productId === p.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {products.map((p) => {
                const out = p.stockOnHand <= 0;
                const selected = productId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => !out && setProductId(p.id)}
                    disabled={out}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 ${
                      selected ? "bg-blue-50" : "hover:bg-gray-50"
                    } ${out ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.categoryName ?? "—"} · {p.unitPrice.toFixed(2)}€/
                        {p.unit === "gram" ? "g" : "ea"} ·{" "}
                        {out
                          ? t("ops.sell.outOfStock")
                          : t(p.unit === "gram" ? "ops.sell.leftG" : "ops.sell.leftEa", {
                              qty: p.stockOnHand.toFixed(p.unit === "gram" ? 1 : 0),
                            })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Step 3 — quantity + confirm */}
      <section
        className={`bg-white rounded-2xl shadow-lg overflow-hidden ${
          !product || !member || locked ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-900">
            {product
              ? t(product.unit === "gram" ? "ops.sell.step3Grams" : "ops.sell.step3Pieces")
              : t("ops.sell.step3")}
          </p>
        </div>
        <div className="p-4 space-y-3">
          <input
            type="number"
            step={product?.unit === "piece" ? "1" : "0.1"}
            min="0"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setScaleReading(null);
            }}
            placeholder={t(product?.unit === "gram" ? "ops.sell.placeholderG" : "ops.sell.placeholderEa")}
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg font-semibold text-gray-900 text-center"
          />
          {product?.unit === "gram" && (
            <ScalePanel
              onUseReading={(reading) => {
                setQuantity(reading.weightGrams.toFixed(2));
                setScaleReading({ raw: reading.raw });
                if (!reading.stable) {
                  toast.warning(t("ops.sell.unstable"));
                }
              }}
            />
          )}
          {scaleReading && (
            <p className="text-[11px] text-blue-600 text-center">
              {t("ops.sell.scaleCaptured")}
            </p>
          )}
          {product && qtyValid && (
            <div
              className={`rounded-lg p-3 text-center ${
                inStock ? "bg-gray-50" : "bg-red-50"
              }`}
            >
              {inStock ? (
                <>
                  <p className="text-xs text-gray-500">{t("ops.sell.total")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {total.toFixed(2)} €
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {qty}
                    {product.unit === "gram" ? "g" : ""} @{" "}
                    {product.unitPrice.toFixed(2)}€/
                    {product.unit === "gram" ? "g" : "ea"}
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-700 font-semibold">
                  {t("ops.sell.insufficient", {
                    qty: `${product.stockOnHand.toFixed(product.unit === "gram" ? 1 : 0)}${product.unit === "gram" ? "g" : ""}`,
                  })}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !!receipt || !member || !product || !qtyValid || !inStock}
            className="w-full rounded-lg bg-green-600 text-white text-sm font-semibold py-3 hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? t("ops.sell.recording") : t("ops.sell.recordSale")}
          </button>
        </div>
      </section>
    </div>
  );
}
