"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

type MediaType = "image" | "video" | "audio";

interface MediaItem {
  id: string;
  media_url: string;
  media_type: MediaType;
  mime_type: string | null;
  caption: string | null;
}

export function MediaGallery({ items }: { items: MediaItem[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (items.length === 0) return null;

  const expanded = expandedIdx !== null ? items[expandedIdx] : null;

  const goPrev = () => setExpandedIdx((i) => (i !== null ? (i - 1 + items.length) % items.length : null));
  const goNext = () => setExpandedIdx((i) => (i !== null ? (i + 1) % items.length : null));

  return (
    <>
      <div className="-mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setExpandedIdx(idx)}
              className="snap-start shrink-0 w-32 h-32 rounded-[var(--m-radius-sm)] overflow-hidden"
            >
              <ThumbnailFor item={item} />
            </button>
          ))}
        </div>
      </div>

      {expanded && (
        <LightboxOverlay
          item={expanded}
          hasPrev={items.length > 1}
          hasNext={items.length > 1}
          onPrev={goPrev}
          onNext={goNext}
          onClose={() => setExpandedIdx(null)}
        />
      )}
    </>
  );
}

function ThumbnailFor({ item }: { item: MediaItem }) {
  if (item.media_type === "image") {
    return (
      <Image
        src={item.media_url}
        alt={item.caption ?? ""}
        width={128}
        height={128}
        sizes="128px"
        className="w-full h-full object-cover"
      />
    );
  }

  if (item.media_type === "video") {
    return (
      <div className="relative w-full h-full bg-black">
        <video
          src={item.media_url}
          preload="metadata"
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-9 h-9 rounded-full bg-black/60 flex items-center justify-center">
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center text-gray-600 px-2 text-center">
      <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-3c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
      </svg>
      <span className="text-[10px] uppercase tracking-wide">Audio</span>
    </div>
  );
}

function LightboxOverlay({
  item,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
}: {
  item: MediaItem;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrev();
      else if (e.key === "ArrowRight") onNext();
      else if (e.key === "Escape") onClose();
    },
    [onPrev, onNext, onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Click-to-advance only for images. Video/audio need their own controls,
  // so a click on the player should not skip to the next item.
  const advanceOnClick = item.media_type === "image" && hasNext;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        {item.media_type === "image" && (
          <Image
            src={item.media_url}
            alt={item.caption ?? ""}
            width={1600}
            height={1200}
            sizes="(max-width: 640px) 100vw, 768px"
            onClick={(e) => {
              e.stopPropagation();
              if (advanceOnClick) onNext();
            }}
            className="w-full h-auto rounded-[var(--m-radius-sm)] object-contain max-h-[80vh] cursor-pointer select-none"
          />
        )}

        {item.media_type === "video" && (
          <video
            src={item.media_url}
            controls
            autoPlay
            playsInline
            className="w-full rounded-[var(--m-radius-sm)] max-h-[80vh] bg-black"
          />
        )}

        {item.media_type === "audio" && (
          <div className="w-full bg-gray-900 rounded-[var(--m-radius-sm)] p-6 flex flex-col items-center gap-4">
            <svg className="w-16 h-16 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-3c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
            </svg>
            <audio src={item.media_url} controls autoPlay className="w-full" />
          </div>
        )}

        {item.caption && (
          <p className="text-white/70 text-sm text-center mt-3">{item.caption}</p>
        )}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
