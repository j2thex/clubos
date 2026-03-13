"use client";

import { useState, useCallback, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import confetti from "canvas-confetti";

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
    const [fullscreen, setFullscreen] = useState(false);
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

        // Load SVG images as HTMLImageElements
        const loadImage = (src: string): Promise<HTMLImageElement> =>
          new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });

        const [hubImg, overlayImg] = await Promise.all([
          loadImage("/wheel/hub.svg"),
          loadImage("/wheel/overlay.svg"),
        ]);

        if (!mounted || !containerRef.current) return;

        const wheel = new Wheel(containerRef.current, {
          items,
          isInteractive: false,
          pointerAngle: 0,
          radius: 0.84,
          itemLabelRotation: 180,
          itemLabelAlign: "left",
          itemLabelFont: "Impact, Arial Black, sans-serif",
          itemLabelFontSizeMax: 36,
          itemLabelRadius: 0.93,
          itemLabelRadiusMax: 0.35,
          itemLabelBaselineOffset: -0.07,
          lineWidth: 1,
          lineColor: "#fff",
          borderWidth: 0,
          overlayImage: overlayImg,
          image: hubImg,
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

    const fireConfetti = useCallback(() => {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.5 },
        colors: ["#facc15", "#22c55e", "#3b82f6", "#ef4444", "#a855f7"],
      });
    }, []);

    const dismissFullscreen = useCallback(() => {
      setFullscreen(false);
      setResult(null);
    }, []);

    const animateSpin = useCallback((spinResult: SpinResult) => {
      if (!wheelRef.current) return;

      setFullscreen(true);
      setSpinning(true);
      setResult(null);
      setError(null);

      const duration = 4000;
      wheelRef.current.spinToItem(spinResult.segmentIndex, duration, true, 2, 1);

      setTimeout(() => {
        setResult(spinResult.outcome);
        setCurrentBalance(spinResult.newBalance);
        setSpinning(false);
        if (spinResult.outcome.rewardType !== "nothing") {
          fireConfetti();
        }
      }, duration);
    }, [fireConfetti]);

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
        {/* Dark backdrop when fullscreen */}
        {fullscreen && (
          <div
            className="fixed inset-0 z-[9990] bg-black/85 transition-opacity"
            onClick={!spinning && result ? dismissFullscreen : undefined}
          />
        )}

        {/* Wheel container — goes fullscreen when spinning */}
        <div
          className={
            fullscreen
              ? "fixed z-[9991] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[92vmin] h-[92vmin] max-w-[600px] max-h-[600px]"
              : "relative w-full max-w-[480px] aspect-square mx-auto"
          }
          style={{ transition: "all 0.3s ease-out" }}
        >
          <div ref={containerRef} className="w-full h-full" />

          {/* Result overlay */}
          {result && !spinning && (
            <div
              className="absolute z-20 flex items-center justify-center pointer-events-none"
              style={{
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "40%",
                height: "40%",
                borderRadius: "50%",
                backgroundColor: "rgba(0, 0, 0, 0.72)",
              }}
            >
              <span className="text-center font-bold" style={{ color: "#facc15", fontSize: "1.3rem" }}>
                {result.label}
              </span>
            </div>
          )}
        </div>

        {/* Tap to close hint */}
        {fullscreen && result && !spinning && (
          <div
            className="fixed z-[9992] bottom-8 left-0 right-0 text-center"
            onClick={dismissFullscreen}
          >
            <p className="text-white/60 text-sm animate-pulse">Tap anywhere to close</p>
          </div>
        )}

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
