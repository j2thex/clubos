"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function CollapsibleSection({
  id,
  title,
  caption,
  defaultOpen = false,
  children,
}: {
  id?: string;
  title: string;
  caption?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    if (typeof window === "undefined") return;
    if (window.location.hash === `#${id}`) {
      setOpen(true);
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [id]);

  return (
    <div id={id} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-3 px-1 py-1 group text-left"
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {title}
          </h2>
          {caption && (
            <p className="mt-0.5 text-xs text-gray-400 normal-case font-normal">
              {caption}
            </p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform shrink-0 mt-1 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}
