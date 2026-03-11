"use client";

import { useState, useEffect } from "react";

export function AddToHomescreen() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    // Don't show if already dismissed or if running in standalone mode
    if (localStorage.getItem("clubos-a2hs-dismissed")) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if ((navigator as any).standalone) return; // iOS standalone check

    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) {
      setPlatform("ios");
      setShow(true);
    } else if (/Android/.test(ua)) {
      setPlatform("android");
      setShow(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem("clubos-a2hs-dismissed", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 flex items-start gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full club-tint-bg flex items-center justify-center mt-0.5">
        <svg className="w-5 h-5 club-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">Add to Home Screen</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {platform === "ios"
            ? "Tap the Share button, then \"Add to Home Screen\" for quick access."
            : "Tap the menu (\u22ee), then \"Add to Home Screen\" for quick access."}
        </p>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-xs font-semibold club-primary hover:opacity-70 transition-opacity mt-1"
      >
        Got it
      </button>
    </div>
  );
}
