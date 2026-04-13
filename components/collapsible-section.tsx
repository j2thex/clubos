"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function CollapsibleSection({
  id,
  title,
  defaultOpen = false,
  children,
}: {
  id?: string;
  title: string;
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
        className="w-full flex items-center justify-between px-1 py-1 group"
      >
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {title}
        </h2>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
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
