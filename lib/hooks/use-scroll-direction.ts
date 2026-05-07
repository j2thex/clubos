"use client";

import { useEffect, useState } from "react";

interface Options {
  /** When true, the hook always returns false. */
  disabled?: boolean;
  /** Minimum delta (px) before changing direction to avoid jitter. */
  threshold?: number;
  /** Always-show zone at the top of the page. */
  topOffset?: number;
  /** Always-show zone within this distance of the page bottom. */
  bottomOffset?: number;
}

/**
 * Hide-on-scroll-down, reveal-on-scroll-up.
 *
 * Returns `hidden`. Always false at the top of the page (< topOffset),
 * always false near the bottom (within bottomOffset of scrollHeight).
 * rAF-throttled, passive listener — safe on iOS Safari.
 */
export function useScrollDirection({
  disabled = false,
  threshold = 8,
  topOffset = 80,
  bottomOffset = 60,
}: Options = {}): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (disabled) return;

    let lastY = window.scrollY;
    let ticking = false;

    const update = (next: boolean) =>
      setHidden((prev) => (prev === next ? prev : next));

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const diff = y - lastY;

        if (Math.abs(diff) < threshold) {
          ticking = false;
          return;
        }

        if (y < topOffset) {
          update(false);
        } else {
          const nearBottom =
            window.innerHeight + y >=
            document.documentElement.scrollHeight - bottomOffset;
          if (nearBottom) {
            update(false);
          } else if (diff > 0) {
            update(true);
          } else {
            update(false);
          }
        }

        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [disabled, threshold, topOffset, bottomOffset]);

  // When disabled, force-show without touching internal state — avoids
  // setState-in-effect and lets the listener resume cleanly when re-enabled.
  return disabled ? false : hidden;
}
