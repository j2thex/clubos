"use client";

import { useState, useEffect } from "react";
import { Share } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";

// Set to `true` during QA: banner shows on every member-home load, ignoring
// the once-only flag. Flip to `false` in a follow-up one-line PR once Mikita
// signs off on staging.
const A2HS_TEST_MODE = true;

export function AddToHomescreen({ clubSlug }: { clubSlug: string }) {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Already installed → never show
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // iOS-specific standalone flag (Safari sets this on home-screen launches)
    if ((navigator as unknown as { standalone?: boolean }).standalone) return;

    // iOS only — Android gets its own install prompt flow (future work)
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    if (!isIOS) return;

    if (A2HS_TEST_MODE) {
      setShow(true);
      return;
    }

    // Production: show once per club per device. Record the sighting
    // immediately on mount so navigating away counts as "seen".
    const key = `clubos-a2hs-${clubSlug}-seen`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setShow(true);
  }, [clubSlug]);

  function dismiss() {
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 flex items-start gap-3 relative overflow-hidden">
      <div className="shrink-0 w-9 h-9 rounded-full club-tint-bg flex items-center justify-center mt-0.5">
        <Share className="w-5 h-5 club-primary" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{t("a2hs.title")}</p>
        <p className="text-xs text-gray-500 mt-0.5">{t("a2hs.ios")}</p>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium club-primary">
          <Share className="w-3.5 h-3.5 animate-a2hs-bounce" strokeWidth={2.5} />
          <span className="animate-a2hs-bounce">↓</span>
        </div>
      </div>
      <button
        onClick={dismiss}
        className="shrink-0 text-xs font-semibold club-primary hover:opacity-70 transition-opacity mt-1"
      >
        {t("a2hs.dismiss")}
      </button>
    </div>
  );
}
