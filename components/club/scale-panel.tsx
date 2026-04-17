"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { isWebSerialSupported, type ScaleAdapter, type ScaleReading } from "@/lib/hardware/scale";
import { OhausNV422Adapter } from "@/lib/hardware/ohaus-nv422";

type ConnectionState = "disconnected" | "connecting" | "connected";

export function ScalePanel({
  onUseReading,
}: {
  onUseReading: (reading: ScaleReading) => void;
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

  function handleUse() {
    if (!reading) return;
    if (reading.weightGrams <= 0) {
      toast.error(t("ops.scale.placeProduct"));
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

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
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
      </div>
      <button
        type="button"
        onClick={handleUse}
        disabled={!reading || reading.weightGrams <= 0}
        className="w-full rounded-lg bg-blue-600 text-white text-xs font-semibold py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        {t("ops.scale.use")}
      </button>
    </div>
  );
}
