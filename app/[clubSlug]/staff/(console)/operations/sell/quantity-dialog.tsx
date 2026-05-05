"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { ScalePanel } from "@/components/club/scale-panel";

export type QuantityDialogPayload = {
  quantity: number;
  weightSource: "manual" | "scale";
  scaleRawReading: string | null;
  /** Target grams committed by staff (typed, or computed from price). Null
   * for piece products. Surfaced server-side for the tolerance re-check. */
  weightRequested: number | null;
  /** € amount entered when sold by price; null for weight mode and pieces. */
  priceInput: number | null;
};

type Mode = "weight" | "price";

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function QuantityDialog({
  open,
  productName,
  unit,
  unitPrice,
  stockOnHand,
  initialQuantity,
  onClose,
  onAdd,
}: {
  open: boolean;
  productName: string;
  unit: "gram" | "piece";
  unitPrice: number;
  stockOnHand: number;
  initialQuantity?: number;
  onClose: () => void;
  onAdd: (payload: QuantityDialogPayload) => void;
}) {
  const { t } = useLanguage();
  // Price-mode toggle is only meaningful when the product is sold by gram and
  // has a non-zero unit price. For piece products the dialog stays minimal.
  const allowPriceMode = unit === "gram" && unitPrice > 0;
  const [mode, setMode] = useState<Mode>("weight");
  const [inputValue, setInputValue] = useState<string>(
    initialQuantity ? String(initialQuantity) : "",
  );
  const [scaleGrams, setScaleGrams] = useState<number | null>(null);
  const [scaleRaw, setScaleRaw] = useState<string | null>(null);

  if (!open) return null;

  const inputNum = Number(inputValue);
  const inputValid = Number.isFinite(inputNum) && inputNum > 0;

  // For weight mode the input itself is grams; for price mode the input is
  // €, and grams = price / unit_price (rounded to 2 decimals so it lines up
  // with the scale's resolution).
  const targetGrams =
    mode === "weight"
      ? inputValid
        ? inputNum
        : null
      : inputValid && unitPrice > 0
        ? round2(inputNum / unitPrice)
        : null;

  // Effective grams committed to the cart. Scale value wins when captured —
  // that's the actual weight; the typed/computed grams is the target only.
  const effectiveGrams =
    unit === "piece" ? inputNum : (scaleGrams ?? targetGrams);

  const stockOk =
    effectiveGrams !== null &&
    Number.isFinite(effectiveGrams) &&
    effectiveGrams > 0 &&
    effectiveGrams <= stockOnHand;

  const canSubmit =
    unit === "piece"
      ? inputValid && inputNum <= stockOnHand
      : inputValid && stockOk;

  function resetCapture() {
    setScaleGrams(null);
    setScaleRaw(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    if (unit === "piece") {
      onAdd({
        quantity: inputNum,
        weightSource: "manual",
        scaleRawReading: null,
        weightRequested: null,
        priceInput: null,
      });
    } else {
      // Gram product: prefer the scale capture, fall back to the typed/computed
      // target if staff is selling without a connected scale.
      const grams = scaleGrams ?? (targetGrams as number);
      onAdd({
        quantity: grams,
        weightSource: scaleGrams !== null ? "scale" : "manual",
        scaleRawReading: scaleRaw,
        weightRequested: targetGrams,
        priceInput: mode === "price" ? inputNum : null,
      });
    }

    setInputValue("");
    resetCapture();
    setMode("weight");
  }

  const titleKey =
    unit === "gram" ? "ops.sell.gramQuantityTitle" : "ops.sell.pieceQuantityTitle";

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
          {allowPriceMode && (
            <div className="inline-flex w-full rounded-lg border border-gray-300 overflow-hidden text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  if (mode !== "weight") {
                    setMode("weight");
                    setInputValue("");
                    resetCapture();
                  }
                }}
                className={`flex-1 py-2 ${
                  mode === "weight" ? "bg-gray-900 text-white" : "bg-white text-gray-600"
                }`}
                aria-pressed={mode === "weight"}
              >
                {t("ops.sell.modeWeight")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (mode !== "price") {
                    setMode("price");
                    setInputValue("");
                    resetCapture();
                  }
                }}
                className={`flex-1 py-2 border-l border-gray-300 ${
                  mode === "price" ? "bg-gray-900 text-white" : "bg-white text-gray-600"
                }`}
                aria-pressed={mode === "price"}
              >
                {t("ops.sell.modePrice")}
              </button>
            </div>
          )}

          <input
            type="number"
            step={
              unit === "piece"
                ? "1"
                : mode === "price"
                  ? "0.01"
                  : "0.1"
            }
            min="0"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              // Editing the target invalidates any prior scale capture: the
              // window may have moved.
              resetCapture();
            }}
            placeholder={t(
              unit === "gram"
                ? mode === "price"
                  ? "ops.sell.placeholderEur"
                  : "ops.sell.placeholderG"
                : "ops.sell.placeholderEa",
            )}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-lg font-semibold text-gray-900 text-center"
          />

          {unit === "gram" && mode === "price" && targetGrams !== null && (
            <p className="text-[11px] text-gray-600 text-center tabular-nums">
              {t("ops.sell.computedGrams", {
                grams: targetGrams.toFixed(2),
                price: unitPrice.toFixed(2),
              })}
            </p>
          )}

          {unit === "gram" && (
            <ScalePanel
              targetWeight={targetGrams ?? undefined}
              onUseReading={(reading) => {
                setScaleGrams(reading.weightGrams);
                setScaleRaw(reading.raw);
                if (!reading.stable) toast.warning(t("ops.sell.unstable"));
              }}
            />
          )}

          {scaleGrams !== null && (
            <p className="text-[11px] text-blue-600 text-center tabular-nums">
              {t("ops.sell.scaleCapturedAt", {
                grams: scaleGrams.toFixed(2),
              })}
            </p>
          )}

          {unit === "gram" && inputValid && !stockOk && effectiveGrams !== null && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 text-center font-semibold">
              {t("ops.sell.insufficient", {
                qty: `${stockOnHand.toFixed(1)}g`,
              })}
            </div>
          )}
          {unit === "piece" && inputValid && inputNum > stockOnHand && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 text-center font-semibold">
              {t("ops.sell.insufficient", {
                qty: `${stockOnHand.toFixed(0)}`,
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
