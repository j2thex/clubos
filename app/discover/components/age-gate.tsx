"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/provider";

const STORAGE_KEY = "clubos-age-verified";

export function AgeGate() {
  const { t } = useLanguage();
  const [verified, setVerified] = useState<boolean | null>(null); // null = loading
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setVerified(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const handleConfirm = () => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      setVerified(true);
    }, 700);
  };

  // Still loading or already verified — render nothing
  if (verified === null || verified) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-700 ease-out ${
        exiting ? "opacity-0 backdrop-blur-0" : "opacity-100 backdrop-blur-[40px]"
      }`}
      style={{ backgroundColor: exiting ? "transparent" : "rgba(0,0,0,0.50)" }}
    >
      {/* Grain texture overlay */}
      <div className="age-gate-grain pointer-events-none absolute inset-0" />

      {/* Glassmorphic card */}
      <div
        className={`relative z-10 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/[0.10] px-8 py-10 text-center transition-all duration-700 ease-out ${
          exiting
            ? "scale-90 opacity-0 translate-y-4"
            : "scale-100 opacity-100 translate-y-0"
        }`}
        style={{
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      >
        {/* 18+ numeral */}
        <p className="font-mono text-[120px] leading-none font-bold tracking-tighter text-white/90 select-none">
          18<span className="text-primary">+</span>
        </p>

        {/* Divider */}
        <div className="mx-auto mt-4 mb-5 h-px w-16 bg-primary/40" />

        {/* Subtitle */}
        <p className="text-sm font-medium tracking-wide uppercase text-white/60 mb-3">
          {t("discover.ageGate.subtitle")}
        </p>

        {/* Body */}
        <p className="text-sm leading-relaxed text-white/40 mb-8">
          {t("discover.ageGate.body")}
        </p>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          className="w-full rounded-xl bg-primary py-3.5 px-6 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          style={{
            boxShadow: "0 0 30px rgba(22,163,74,0.25), 0 0 60px rgba(22,163,74,0.10)",
          }}
        >
          {t("discover.ageGate.confirm")}
        </button>
      </div>
    </div>
  );
}
