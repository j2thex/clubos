"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/lib/i18n/provider";

export function SignaturePad({
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const hasStrokesRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Derive preview URL from file via useMemo (avoids set-state-in-effect).
  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Size the canvas to the CSS width at 2x for crispness on retina.
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
    if (value) return; // no canvas when showing preview
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [value, resizeCanvas]);

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
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `signature-${Date.now()}.png`, {
          type: "image/png",
        });
        onChange(file);
      },
      "image/png",
    );
  }

  function redo() {
    onChange(null);
    hasStrokesRef.current = false;
    // resize happens after render via effect
  }

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
      ) : (
        <div className="space-y-2">
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
          </div>
          <p className="text-[11px] text-gray-400">
            {t("ops.memberForm.signature.hint")}
          </p>
        </div>
      )}
    </div>
  );
}
