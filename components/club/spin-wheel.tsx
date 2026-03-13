"use client";

import { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from "react";

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
  onSpin?: () => Promise<SpinResult | { error: string }>;
  hideButton?: boolean;
}

export interface SpinWheelHandle {
  spin: (result: SpinResult) => void;
  isSpinning: () => boolean;
}

const SpinWheel = forwardRef<SpinWheelHandle, SpinWheelProps>(
  function SpinWheel({ segments, balance, onSpin, hideButton }, ref) {
    const [spinning, setSpinning] = useState(false);
    const [currentBalance, setCurrentBalance] = useState(balance);
    const [result, setResult] = useState<SpinResult["outcome"] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setCurrentBalance(balance);
      setResult(null);
      setError(null);
    }, [balance]);

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

        // Wait for Amatic SC font to be available
        await document.fonts.ready;

        const wheel = new Wheel(containerRef.current, {
          items,
          isInteractive: false,
          pointerAngle: 0,
          radius: 0.84,
          itemLabelRotation: 180,
          itemLabelAlign: "left",
          itemLabelFont: "Amatic SC",
          itemLabelFontSizeMax: 55,
          itemLabelRadius: 0.93,
          itemLabelRadiusMax: 0.35,
          itemLabelBaselineOffset: -0.07,
          lineWidth: 1,
          lineColor: "#fff",
          borderWidth: 0,
          overlayImage: "/wheel/overlay.svg",
          image: "/wheel/hub.svg",
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

    const animateSpin = useCallback((spinResult: SpinResult) => {
      if (!wheelRef.current) return;

      setSpinning(true);
      setResult(null);
      setError(null);

      const duration = 4000;
      wheelRef.current.spinToItem(spinResult.segmentIndex, duration, true, 2, 1);

      setTimeout(() => {
        setResult(spinResult.outcome);
        setCurrentBalance(spinResult.newBalance);
        setSpinning(false);
      }, duration);
    }, []);

    useImperativeHandle(ref, () => ({
      spin: animateSpin,
      isSpinning: () => spinning,
    }), [animateSpin, spinning]);

    const handleSpin = useCallback(async () => {
      if (spinning || currentBalance <= 0 || !wheelRef.current || !onSpin) return;

      setSpinning(true);
      setResult(null);
      setError(null);

      const res = await onSpin();

      if ("error" in res) {
        setError(res.error);
        setSpinning(false);
        return;
      }

      animateSpin(res as SpinResult);
    }, [spinning, currentBalance, onSpin, animateSpin]);

    return (
      <div className="flex flex-col items-center gap-6">
        {/* Wheel container */}
        <div className="relative" style={{ width: 392, height: 392 }}>
          <div ref={containerRef} className="w-full h-full" />

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

        {/* Spin button — hidden when parent controls spinning */}
        {!hideButton && (
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
        )}

        {/* Error display */}
        {error && (
          <div className="text-center p-3 rounded-lg border border-red-500/30 bg-red-500/10">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    );
  }
);

export default SpinWheel;
