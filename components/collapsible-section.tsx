"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function CollapsibleSection({
  id,
  title,
  caption,
  titleAdornment,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  children,
}: {
  id?: string;
  title: string;
  caption?: string;
  titleAdornment?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (next: boolean) => void;
  children: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const ref = useRef<HTMLDivElement>(null);

  function setOpen(next: boolean) {
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!id) return;
    if (typeof window === "undefined") return;
    if (window.location.hash === `#${id}`) {
      setOpen(true);
      ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            {titleAdornment}
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
