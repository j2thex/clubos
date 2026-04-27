"use client";

import { useEffect } from "react";

export function MemberPhotosLightbox({
  open,
  onClose,
  portraitUrl,
  idPhotoUrl,
  memberName,
  memberCode,
}: {
  open: boolean;
  onClose: () => void;
  portraitUrl: string | null;
  idPhotoUrl: string | null;
  memberName: string | null;
  memberCode: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const title = memberName?.trim() ? memberName : memberCode;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photos for ${title}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{title}</p>
            {memberName?.trim() && (
              <p className="font-mono text-xs text-gray-500">{memberCode}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
          <PhotoTile label="Portrait" url={portraitUrl} />
          <PhotoTile label="ID photo" url={idPhotoUrl} />
        </div>
      </div>
    </div>
  );
}

function PhotoTile({ label, url }: { label: string; url: string | null }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <div className="aspect-[4/3] rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-xs text-gray-400">Not captured</span>
        )}
      </div>
    </div>
  );
}
