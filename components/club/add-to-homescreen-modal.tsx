"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/lib/i18n/provider";

const STEPS = [
  { n: 1, imgKey: "/a2hs/step-1.jpg", captionKey: "a2hs.step1" },
  { n: 2, imgKey: "/a2hs/step-2.jpg", captionKey: "a2hs.step2" },
  { n: 3, imgKey: "/a2hs/step-3.jpg", captionKey: "a2hs.step3" },
  { n: 4, imgKey: "/a2hs/step-4.jpg", captionKey: "a2hs.step4" },
] as const;

export function AddToHomescreenModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const titleId = "a2hs-modal-title";

  // Mount/animate in when open flips true; animate out then unmount when open flips false.
  useEffect(() => {
    if (open) {
      setVisible(true);
      // Next frame: trigger the slide-in by setting animating=true.
      const raf = requestAnimationFrame(() => setAnimating(true));
      return () => cancelAnimationFrame(raf);
    }
    setAnimating(false);
    const timer = setTimeout(() => setVisible(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

  // Lock body scroll while modal is visible.
  // iOS Safari ignores `overflow: hidden` on body for touch scroll chaining —
  // we have to take the body out of flow with `position: fixed` and restore
  // the scroll offset on unmount. Pair with `overscroll-behavior: contain` on
  // the inner scroller below to block rubber-band boundary chaining too.
  useEffect(() => {
    if (!visible) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [visible]);

  // Focus close button on open; Escape key closes.
  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t("a2hs.close")}
        onClick={onClose}
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          animating ? "opacity-50" : "opacity-0"
        }`}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col transition-transform duration-300 ease-out ${
          animating ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle (decorative) */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-3">
          <h2 id={titleId} className="text-base font-semibold text-gray-900">
            {t("a2hs.stepsTitle")}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={t("a2hs.close")}
            className="shrink-0 -mt-1 -mr-1 p-1 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable step list */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 space-y-4">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl bg-gray-50 p-4 flex items-start gap-3"
            >
              <div className="shrink-0 w-7 h-7 rounded-full bg-[color:var(--club-primary,#16a34a)] text-white font-bold flex items-center justify-center text-sm">
                {step.n}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-2">
                  {t(step.captionKey)}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={step.imgKey}
                  alt=""
                  className="w-full rounded-xl border border-gray-200"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom fade affordance */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  );
}
