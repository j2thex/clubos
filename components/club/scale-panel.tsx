"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import {
  isWebSerialSupported,
  isWithinTolerance,
  WEIGHT_TOLERANCE_G,
  type ScaleAdapter,
  type ScaleReading,
} from "@/lib/hardware/scale";
import { OhausNV422Adapter } from "@/lib/hardware/ohaus-nv422";

type ConnectionState = "disconnected" | "connecting" | "connected";

export function ScalePanel({
  onUseReading,
  targetWeight,
}: {
  onUseReading: (reading: ScaleReading) => void;
  /**
   * When set, the panel enforces ±WEIGHT_TOLERANCE_G against this target:
   * the "Use reading" button stays disabled until the live reading falls
   * inside the tolerance window. A delta line tells staff which direction
   * to adjust. The same check runs server-side in record_sale.
   */
  targetWeight?: number;
}) {
  const { t } = useLanguage();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [state, setState] = useState<ConnectionState>("disconnected");
  const [reading, setReading] = useState<ScaleReading | null>(null);
  const adapterRef = useRef<ScaleAdapter | null>(null);

  // Check browser support once on mount (avoids SSR/client mismatch).
  useEffect(() => {
    setSupported(isWebSerialSupported());
  }, []);

  useEffect(() => {
    return () => {
      // Clean up on unmount.
      adapterRef.current?.disconnect().catch(() => {});
      adapterRef.current = null;
    };
  }, []);

  async function handleConnect() {
    if (!isWebSerialSupported()) return;
    const adapter = new OhausNV422Adapter();
    setState("connecting");
    try {
      await adapter.connect();
      adapter.onReading((r) => setReading(r));
      adapterRef.current = adapter;
      setState("connected");
      toast.success(t("ops.scale.connected"));
    } catch (err) {
      setState("disconnected");
      const message =
        err instanceof Error && err.name === "NotFoundError"
          ? t("ops.scale.noDevice")
          : err instanceof Error
            ? err.message
            : t("ops.scale.connectFailed");
      toast.error(message);
    }
  }

  async function handleDisconnect() {
    try {
      await adapterRef.current?.disconnect();
    } catch {
      // ignore
    }
    adapterRef.current = null;
    setState("disconnected");
    setReading(null);
  }

  const hasTarget = typeof targetWeight === "number" && targetWeight > 0;
  const delta =
    hasTarget && reading ? reading.weightGrams - (targetWeight as number) : null;
  const inTolerance =
    hasTarget && reading
      ? isWithinTolerance(reading.weightGrams, targetWeight as number)
      : false;

  function handleUse() {
    if (!reading) return;
    if (reading.weightGrams <= 0) {
      toast.error(t("ops.scale.placeProduct"));
      return;
    }
    if (hasTarget && !inTolerance) {
      // Button is disabled in this state, but guard anyway in case the
      // disabled UI is bypassed by a keyboard handler.
      toast.error(t("ops.scale.outOfRange"));
      return;
    }
    onUseReading(reading);
  }

  // SSR-safe: while we don't know yet, render nothing.
  if (supported === null) return null;

  if (!supported) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
        {t("ops.scale.unsupported")}
      </div>
    );
  }

  if (state === "disconnected") {
    return (
      <button
        type="button"
        onClick={handleConnect}
        className="w-full rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 py-2 hover:bg-gray-50"
      >
        {t("ops.scale.connect")}
      </button>
    );
  }

  if (state === "connecting") {
    return (
      <div className="rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600 text-center">
        {t("ops.scale.opening")}
      </div>
    );
  }

  // Connected: frame turns green when in the tolerance window, amber when a
  // target is set but the reading is out of range.
  const frameTone =
    hasTarget && reading
      ? inTolerance
        ? "border-green-300 bg-green-50"
        : "border-amber-300 bg-amber-50"
      : "border-gray-200 bg-gray-50";

  return (
    <div className={`rounded-lg border ${frameTone} p-3 space-y-2`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {t("ops.scale.label")}
        </span>
        <button
          type="button"
          onClick={handleDisconnect}
          className="text-[11px] text-gray-500 hover:text-red-600"
        >
          {t("ops.scale.disconnect")}
        </button>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-gray-900 tabular-nums">
          {reading ? `${reading.weightGrams.toFixed(2)} g` : "—"}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {reading
            ? reading.stable
              ? t("ops.scale.stable")
              : t("ops.scale.stabilizing")
            : t("ops.scale.waiting")}
        </p>
        {hasTarget && reading && delta !== null && (
          <p
            className={`text-[11px] font-semibold mt-1 tabular-nums ${
              inTolerance ? "text-green-700" : "text-amber-800"
            }`}
          >
            {inTolerance
              ? t("ops.scale.toleranceOk", {
                  target: (targetWeight as number).toFixed(2),
                })
              : delta < 0
                ? t("ops.scale.addMore", {
                    diff: Math.abs(delta).toFixed(2),
                  })
                : t("ops.scale.removeSome", { diff: delta.toFixed(2) })}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleUse}
        disabled={
          !reading ||
          reading.weightGrams <= 0 ||
          (hasTarget && !inTolerance)
        }
        className="w-full rounded-lg bg-blue-600 text-white text-xs font-semibold py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {t("ops.scale.use")}
      </button>
      {hasTarget && (
        <p className="text-[10px] text-gray-400 text-center">
          {t("ops.scale.toleranceHint", {
            target: (targetWeight as number).toFixed(2),
            tol: WEIGHT_TOLERANCE_G.toFixed(2),
          })}
        </p>
      )}
    </div>
  );
}
