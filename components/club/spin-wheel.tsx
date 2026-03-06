"use client";

import { useState, useCallback, useRef } from "react";

interface Segment {
  label: string;
  color: string;
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
  const [rotation, setRotation] = useState(0);
  const totalSpins = useRef(0);

  // Build conic-gradient from segments
  const totalProb = segments.reduce((sum, s) => sum + s.probability, 0);
  const conicStops: string[] = [];
  let cumulative = 0;
  const segmentAngles: { start: number; end: number }[] = [];

  for (const seg of segments) {
    const startPct = (cumulative / totalProb) * 100;
    const segPct = (seg.probability / totalProb) * 100;
    const endPct = startPct + segPct;
    conicStops.push(`${seg.color} ${startPct}% ${endPct}%`);

    const startAngle = (cumulative / totalProb) * 360;
    const endAngle = ((cumulative + seg.probability) / totalProb) * 360;
    segmentAngles.push({ start: startAngle, end: endAngle });

    cumulative += seg.probability;
  }

  const conicGradient = `conic-gradient(${conicStops.join(", ")})`;

  const handleSpin = useCallback(async () => {
    if (spinning || currentBalance <= 0) return;

    setSpinning(true);
    setResult(null);

    const res = await onSpin();

    if ("error" in res) {
      setSpinning(false);
      return;
    }

    const spinResult = res as SpinResult;
    const { segmentIndex } = spinResult;

    // Calculate the angle to land on the winning segment
    // The pointer is at the top (12 o'clock = 0 degrees).
    // Conic gradient starts at 12 o'clock and goes clockwise.
    // We need the wheel to rotate so the winning segment is at the top (under the pointer).
    const segAngle = segmentAngles[segmentIndex];
    const segMid = (segAngle.start + segAngle.end) / 2;

    // The wheel rotates clockwise. To land on a segment at angle `segMid`,
    // we rotate so that segMid ends up at 360 (top). We also add multiple
    // full rotations for dramatic effect.
    totalSpins.current += 1;
    const extraRotations = 5 + totalSpins.current; // more spins each time
    const targetRotation =
      rotation + 360 * extraRotations + (360 - segMid);

    setRotation(targetRotation);

    // Wait for animation to complete, then show result
    setTimeout(() => {
      setResult(spinResult.outcome);
      setCurrentBalance(spinResult.newBalance);
      setSpinning(false);
    }, 4500);
  }, [spinning, currentBalance, onSpin, rotation, segmentAngles]);

  // Render segment labels positioned at the midpoint of each segment
  const labelElements = segments.map((seg, i) => {
    const segAngle = segmentAngles[i];
    const midAngle = (segAngle.start + segAngle.end) / 2;

    return (
      <div
        key={i}
        className="absolute left-1/2 top-1/2 pointer-events-none"
        style={{
          transform: `rotate(${midAngle}deg) translateY(-70px) translateX(-50%)`,
          transformOrigin: "0 0",
        }}
      >
        <span
          className="text-white text-xs font-bold whitespace-nowrap drop-shadow-md"
          style={{
            display: "inline-block",
            transform: `rotate(0deg)`,
          }}
        >
          {seg.label}
        </span>
      </div>
    );
  });

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Balance display */}
      <div className="text-center">
        <p className="text-sm text-gray-400 uppercase tracking-wide">Spins Available</p>
        <p className="text-4xl font-bold text-green-400">{currentBalance}</p>
      </div>

      {/* Wheel container */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80">
        {/* Pointer / arrow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
          <div
            className="w-0 h-0"
            style={{
              borderLeft: "14px solid transparent",
              borderRight: "14px solid transparent",
              borderTop: "24px solid #065f46",
            }}
          />
        </div>

        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-4 border-green-800 shadow-lg shadow-green-900/50 overflow-hidden">
          {/* Spinning wheel */}
          <div
            className="w-full h-full rounded-full relative"
            style={{
              background: conicGradient,
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)"
                : "none",
            }}
          >
            {/* Segment labels */}
            {labelElements}
          </div>
        </div>

        {/* Center hub */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-16 h-16 rounded-full bg-emerald-900 border-4 border-green-700 shadow-inner flex items-center justify-center">
            <span className="text-green-300 text-xs font-bold">SPIN</span>
          </div>
        </div>
      </div>

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={spinning || currentBalance <= 0}
        className="px-8 py-3 rounded-full text-lg font-bold text-white bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-900/40"
      >
        {spinning
          ? "Spinning..."
          : currentBalance <= 0
            ? "No Spins Left"
            : "Spin the Wheel"}
      </button>

      {/* Result display */}
      {result && (
        <div
          className="text-center p-4 rounded-xl border animate-in fade-in zoom-in duration-300"
          style={{
            backgroundColor: result.color + "20",
            borderColor: result.color,
          }}
        >
          <p className="text-sm text-gray-400 mb-1">You won</p>
          <p className="text-2xl font-bold text-white">{result.label}</p>
          {result.value > 0 && (
            <p className="text-sm text-green-400 mt-1">
              Value: {result.value} {result.rewardType}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
