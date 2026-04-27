"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { ScalePanel } from "@/components/club/scale-panel";

export type QuantityDialogPayload = {
  quantity: number;
  weightSource: "manual" | "scale";
  scaleRawReading: string | null;
};

export function QuantityDialog({
  open,
  productName,
  unit,
  stockOnHand,
  initialQuantity,
  onClose,
  onAdd,
}: {
  open: boolean;
  productName: string;
  unit: "gram" | "piece";
  stockOnHand: number;
  initialQuantity?: number;
  onClose: () => void;
  onAdd: (payload: QuantityDialogPayload) => void;
}) {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState<string>(
    initialQuantity ? String(initialQuantity) : "",
  );
  const [scaleRaw, setScaleRaw] = useState<string | null>(null);

  if (!open) return null;

  const qty = Number(quantity);
  const qtyValid = Number.isFinite(qty) && qty > 0;
  const inStock = qty <= stockOnHand;
  const canSubmit = qtyValid && inStock;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onAdd({
      quantity: qty,
      weightSource: scaleRaw ? "scale" : "manual",
      scaleRawReading: scaleRaw,
    });
    setQuantity("");
    setScaleRaw(null);
  }

  const titleKey = unit === "gram" ? "ops.sell.gramQuantityTitle" : "ops.sell.pieceQuantityTitle";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
      onClick={onClose}
      role="presentation"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {t(titleKey, { name: productName })}
          </h2>
        </div>
        <div className="p-5 space-y-3">
          <input
            type="number"
            step={unit === "piece" ? "1" : "0.1"}
            min="0"
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              setScaleRaw(null);
            }}
            placeholder={t(
              unit === "gram" ? "ops.sell.placeholderG" : "ops.sell.placeholderEa",
            )}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg font-semibold text-gray-900 text-center"
          />
          {unit === "gram" && (
            <ScalePanel
              onUseReading={(reading) => {
                setQuantity(reading.weightGrams.toFixed(2));
                setScaleRaw(reading.raw);
                if (!reading.stable) toast.warning(t("ops.sell.unstable"));
              }}
            />
          )}
          {scaleRaw && (
            <p className="text-[11px] text-blue-600 text-center">
              {t("ops.sell.scaleCaptured")}
            </p>
          )}
          {qtyValid && !inStock && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 text-center font-semibold">
              {t("ops.sell.insufficient", {
                qty: `${stockOnHand.toFixed(unit === "gram" ? 1 : 0)}${unit === "gram" ? "g" : ""}`,
              })}
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 py-2.5"
          >
            {t("ops.sell.cancel")}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 rounded-lg bg-gray-900 text-white text-sm font-semibold py-2.5 disabled:opacity-50"
          >
            {t("ops.sell.add")}
          </button>
        </div>
      </form>
    </div>
  );
}
