"use client";

import { useEffect, useState } from "react";

// Thumbnail that opens a full-size lightbox on click. Clicking the
// backdrop or pressing Escape closes it; clicking the image itself
// does nothing so the admin can drag / long-press it.

interface Props {
  src: string;
  alt: string;
  className?: string;
}

export function ImagePreviewThumb({ src, alt, className }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Click to zoom"
        className="shrink-0 group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={`${className ?? ""} cursor-zoom-in group-hover:ring-2 group-hover:ring-emerald-300 transition`}
        />
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 cursor-zoom-out"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default"
          />
        </div>
      )}
    </>
  );
}
