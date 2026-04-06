"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/provider";

const STORAGE_KEY = "clubos-age-verified";

export function AgeGate() {
  const { t } = useLanguage();
  const [verified, setVerified] = useState<boolean | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    setVerified(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const handleConfirm = () => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      setVerified(true);
    }, 1200);
  };

  if (verified === null || verified) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-[1200ms] ease-in-out ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
      style={{ pointerEvents: exiting ? "none" : "auto" }}
    >
      {/* Dark green smoke background */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(22,100,52,0.85) 0%, rgba(6,20,10,0.97) 70%, rgba(0,0,0,0.99) 100%)",
        }}
      />

      {/* Soft green glow wisps */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(22,163,74,0.4) 0%, transparent 70%)",
            top: "10%",
            left: "20%",
            animation: "age-gate-wisp-1 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, rgba(22,163,74,0.3) 0%, transparent 70%)",
            bottom: "10%",
            right: "15%",
            animation: "age-gate-wisp-2 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, rgba(34,197,94,0.3) 0%, transparent 60%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            animation: "age-gate-wisp-3 12s ease-in-out infinite",
          }}
        />
      </div>

      {/* Card — fade only, no slide or scale */}
      <div
        className={`relative z-10 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border border-landing-border px-8 py-10 text-center transition-opacity duration-[1200ms] ease-in-out ${
          exiting ? "opacity-0" : "opacity-100"
        }`}
        style={{
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* 18+ */}
        <p className="font-mono text-[120px] leading-none font-bold tracking-tighter text-landing-text select-none">
          18<span className="text-green-500">+</span>
        </p>

        {/* Divider */}
        <div className="mx-auto mt-4 mb-5 h-px w-16 bg-green-500/30" />

        {/* Subtitle */}
        <p className="text-sm font-medium tracking-wide uppercase text-landing-text-secondary mb-3">
          {t("discover.ageGate.subtitle")}
        </p>

        {/* Body */}
        <p className="text-sm leading-relaxed text-landing-text-tertiary mb-8">
          {t("discover.ageGate.body")}
        </p>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          className="w-full rounded-xl bg-green-600 py-3.5 px-6 text-sm font-semibold text-white transition-all duration-200 hover:bg-green-500 active:bg-green-700 cursor-pointer"
          style={{
            boxShadow: "0 0 40px rgba(22,163,74,0.3), 0 0 80px rgba(22,163,74,0.12)",
          }}
        >
          {t("discover.ageGate.confirm")}
        </button>
      </div>
    </div>
  );
}
