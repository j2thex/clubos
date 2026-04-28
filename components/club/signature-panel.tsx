"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/provider";
import { captureSignature, type CaptureHandle } from "@/lib/hardware/signotec";

type Mode = "idle" | "trying" | "device" | "canvas";

export function SignaturePanel({
  label,
  required,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: File | null;
  onChange: (file: File | null) => void;
}) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>("idle");
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const handleRef = useRef<CaptureHandle | null>(null);

  const previewUrl = useMemo(
    () => (value ? URL.createObjectURL(value) : null),
    [value],
  );
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Cancel any in-flight pad capture if the panel unmounts mid-flow.
  useEffect(() => {
    return () => {
      const handle = handleRef.current;
      handleRef.current = null;
      if (handle) {
        handle.cancel().catch(() => {});
      }
    };
  }, []);

  const startCapture = useCallback(async () => {
    setBridgeError(null);
    setMode("trying");

    let handle: CaptureHandle;
    try {
      handle = await captureSignature({
        fieldName: label,
        customText: "",
        confirmationText: "",
      });
    } catch (err) {
      // Bridge unreachable / no pad / SDK not loadable — fall back to canvas.
      setBridgeError(err instanceof Error ? err.message : String(err));
      setMode("canvas");
      return;
    }

    handleRef.current = handle;
    setMode("device");

    try {
      const file = await handle.promise;
      handleRef.current = null;
      onChange(file);
      setMode("idle");
    } catch (err) {
      handleRef.current = null;
      setBridgeError(err instanceof Error ? err.message : String(err));
      setMode("idle");
    }
  }, [label, onChange]);

  const cancelDeviceCapture = useCallback(async () => {
    const handle = handleRef.current;
    handleRef.current = null;
    if (handle) await handle.cancel().catch(() => {});
    setMode("idle");
  }, []);

  const useCanvasInstead = useCallback(() => {
    setBridgeError(null);
    setMode("canvas");
  }, []);

  const redo = useCallback(() => {
    onChange(null);
    setMode("idle");
  }, [onChange]);

  const onCanvasComplete = useCallback(
    (file: File) => {
      onChange(file);
      setMode("idle");
    },
    [onChange],
  );

  const onCanvasCancel = useCallback(() => {
    setMode("idle");
  }, []);

  const hasFile = Boolean(value && previewUrl);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </span>
        {hasFile && (
          <button
            type="button"
            onClick={redo}
            className="text-[11px] text-blue-600 hover:underline"
          >
            {t("ops.memberForm.signature.redo")}
          </button>
        )}
      </div>

      {hasFile ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl!}
          alt=""
          className="w-full rounded-lg border border-gray-200 bg-white aspect-[5/2] object-contain"
        />
      ) : mode === "canvas" ? (
        <CanvasCapture
          onComplete={onCanvasComplete}
          onCancel={onCanvasCancel}
          fallbackHint={
            bridgeError
              ? `${t("ops.memberForm.signature.fellBack")} (${bridgeError})`
              : null
          }
        />
      ) : mode === "trying" ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-gray-500">
          {t("ops.memberForm.signature.connecting")}
        </div>
      ) : mode === "device" ? (
        <div className="space-y-2">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-3 text-center text-sm font-semibold text-amber-900">
            {t("ops.memberForm.signature.deviceWaiting")}
          </div>
          <p className="text-[11px] text-gray-500 text-center">
            {t("ops.memberForm.signature.deviceHint")}
          </p>
          <button
            type="button"
            onClick={cancelDeviceCapture}
            className="w-full rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 py-2"
          >
            {t("ops.memberForm.signature.cancel")}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            type="button"
            onClick={startCapture}
            className="w-full rounded-lg bg-gray-800 text-white text-sm font-semibold py-4 hover:bg-gray-700 transition flex flex-col items-center gap-0.5"
          >
            <span>{t("ops.memberForm.signature.activate")}</span>
            <span className="text-[11px] font-normal text-gray-300">
              {t("ops.memberForm.signature.activateHint")}
            </span>
          </button>
          <button
            type="button"
            onClick={useCanvasInstead}
            className="w-full text-[11px] text-blue-600 hover:underline"
          >
            {t("ops.memberForm.signature.useScreenInstead")}
          </button>
        </div>
      )}
    </div>
  );
}

function CanvasCapture({
  onComplete,
  onCancel,
  fallbackHint,
}: {
  onComplete: (file: File) => void;
  onCancel: () => void;
  fallbackHint: string | null;
}) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasStrokesRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cssWidth = canvas.clientWidth;
    const cssHeight = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cssWidth, cssHeight);
  }, []);

  useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resizeCanvas]);

  function pointerPosition(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = pointerPosition(e);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPosition(e);
    const last = lastPointRef.current;
    if (last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    lastPointRef.current = { x, y };
    hasStrokesRef.current = true;
  }

  function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = false;
    lastPointRef.current = null;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  }

  function clear() {
    resizeCanvas();
    hasStrokesRef.current = false;
  }

  function confirm() {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokesRef.current) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `signature-${Date.now()}.png`, {
        type: "image/png",
      });
      onComplete(file);
    }, "image/png");
  }

  return (
    <div className="space-y-2">
      {fallbackHint && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-[11px] text-gray-500 text-center">
          {fallbackHint}
        </div>
      )}
      <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-center text-xs font-semibold text-amber-900">
        {t("ops.memberForm.signature.memberPrompt")}
      </div>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="w-full rounded-lg border border-gray-200 bg-white aspect-[5/2] touch-none cursor-crosshair"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirm}
          className="flex-1 rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 hover:bg-gray-700 transition"
        >
          {t("ops.memberForm.signature.confirm")}
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 px-4 py-2"
        >
          {t("ops.memberForm.signature.clear")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 px-4 py-2"
        >
          {t("ops.memberForm.signature.cancel")}
        </button>
      </div>
    </div>
  );
}
