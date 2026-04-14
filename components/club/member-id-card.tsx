"use client";

import { useState } from "react";
import { MemberQrCard } from "./member-qr-card";

interface MemberIdCardProps {
  memberCode: string;
}

/**
 * Tap-to-flip identity panel. Front = QR code (for clubs that scan).
 * Back = big mono uppercase member code (for clubs that read or type
 * the code by sight). 3D rotateY flip animation, both faces share a
 * single white panel.
 */
export function MemberIdCard({ memberCode }: MemberIdCardProps) {
  const [showCode, setShowCode] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setShowCode((v) => !v)}
      aria-label={showCode ? "Show QR code" : "Show member code"}
      className="relative w-full"
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative w-full transition-transform duration-500 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: showCode ? "rotateY(180deg)" : "rotateY(0deg)",
          minHeight: "248px",
        }}
      >
        {/* Front — QR */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[var(--m-radius-sm)] px-4 py-5"
          style={{
            background: "rgba(255,255,255,0.95)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <MemberQrCard memberCode={memberCode} />
          <p
            className="text-[10px] font-semibold uppercase text-[color:var(--m-ink-muted)]"
            style={{ letterSpacing: "0.08em" }}
          >
            TAP TO SHOW CODE
          </p>
        </div>

        {/* Back — big code */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-[var(--m-radius-sm)] px-4 py-5"
          style={{
            background: "rgba(255,255,255,0.95)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p
            className="break-all text-center font-mono font-extrabold uppercase text-[color:var(--m-ink)]"
            style={{
              fontSize: "clamp(36px, 12vw, 56px)",
              lineHeight: 1,
              letterSpacing: "0.14em",
            }}
          >
            {memberCode}
          </p>
          <p
            className="text-[10px] font-semibold uppercase text-[color:var(--m-ink-muted)]"
            style={{ letterSpacing: "0.08em" }}
          >
            TAP TO SHOW QR
          </p>
        </div>
      </div>
    </button>
  );
}
