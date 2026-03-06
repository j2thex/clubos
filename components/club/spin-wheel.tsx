"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface Segment {
  label: string;
  color: string;
  labelColor?: string;
  probability: number;
}

interface SpinResult {
  outcome: {
    label: string;
    rewardType: string;
    value: number;
    color: string;
  };
  newBalance: number;
  segmentIndex: number;
}

interface SpinWheelProps {
  segments: Segment[];
  balance: number;
  onSpin: () => Promise<SpinResult | { error: string }>;
}

export default function SpinWheel({ segments, balance, onSpin }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(balance);
  const [result, setResult] = useState<SpinResult["outcome"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<import("spin-wheel").Wheel | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initWheel() {
      if (!containerRef.current) return;

      const { Wheel } = await import("spin-wheel");

      if (!mounted || !containerRef.current) return;

      const items = segments.map((seg) => ({
        label: seg.label,
        backgroundColor: seg.color,
        labelColor: seg.labelColor ?? "#ffffff",
      }));

      const wheel = new Wheel(containerRef.current, {
        items,
        isInteractive: false,
        pointerAngle: 180,
        itemLabelFontSizeMax: 36,
        itemLabelRadius: 0.92,
        itemLabelRadiusMax: 0.4,
        itemLabelAlign: "right",
        borderWidth: 3,
        borderColor: "#065f46",
        lineWidth: 1,
        lineColor: "#065f46",
        radius: 0.95,
      });

      wheelRef.current = wheel;
    }

    initWheel();

    return () => {
      mounted = false;
      wheelRef.current?.remove();
      wheelRef.current = null;
    };
  }, [segments]);

  const handleSpin = useCallback(async () => {
    if (spinning || currentBalance <= 0 || !wheelRef.current) return;

    setSpinning(true);
    setResult(null);
    setError(null);

    const res = await onSpin();

    if ("error" in res) {
      setError(res.error);
      setSpinning(false);
      return;
    }

    const spinResult = res as SpinResult;
    const { segmentIndex } = spinResult;

    const duration = 4000;
    wheelRef.current.spinToItem(segmentIndex, duration, true, 2, 1);

    setTimeout(() => {
      setResult(spinResult.outcome);
      setCurrentBalance(spinResult.newBalance);
      setSpinning(false);
    }, duration);
  }, [spinning, currentBalance, onSpin]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Balance display */}
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold club-primary">Spins remaining: {currentBalance}</span>
      </div>

      {/* Wheel container */}
      <div className="relative" style={{ width: 392, height: 392 }}>
        {/* Canvas wheel */}
        <div ref={containerRef} className="w-full h-full" />

        {/* Pointer triangle at bottom */}
        <div
          className="absolute left-1/2 z-10"
          style={{
            bottom: -8,
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "12px solid transparent",
            borderRight: "12px solid transparent",
            borderBottom: "22px solid #facc15",
            filter: "drop-shadow(0 0 12px rgba(250, 204, 21, 0.9))",
          }}
        />

        {/* Result overlay */}
        {result && !spinning && (
          <div
            className="absolute z-20 flex items-center justify-center pointer-events-none"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 168,
              height: 168,
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.72)",
            }}
          >
            <span className="text-center font-bold" style={{ color: "#facc15", fontSize: "0.95rem" }}>
              {result.label}
            </span>
          </div>
        )}
      </div>

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={spinning || currentBalance <= 0}
        className="club-btn px-8 py-3 rounded-full text-lg font-bold shadow-lg disabled:cursor-not-allowed"
      >
        {spinning
          ? "Spinning..."
          : currentBalance <= 0
            ? "No Spins Left"
            : "Spin the Wheel"}
      </button>

      {/* Error display */}
      {error && (
        <div className="text-center p-3 rounded-lg border border-red-500/30 bg-red-500/10">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
