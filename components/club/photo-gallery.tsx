"use client";

import { useCallback, useEffect, useState } from "react";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
}

export function PhotoGallery({ images }: { images: GalleryImage[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (images.length === 0) return null;

  const expanded = expandedIdx !== null ? images[expandedIdx] : null;

  const goPrev = () => setExpandedIdx((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  const goNext = () => setExpandedIdx((i) => (i !== null ? (i + 1) % images.length : null));

  return (
    <>
      <div className="-mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setExpandedIdx(idx)}
              className="snap-start shrink-0 w-32 h-32 rounded-[var(--m-radius-sm)] overflow-hidden"
            >
              <img
                src={img.image_url}
                alt={img.caption ?? ""}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {expanded && (
        <LightboxOverlay
          image={expanded}
          hasPrev={images.length > 1}
          hasNext={images.length > 1}
          onPrev={goPrev}
          onNext={goNext}
          onClose={() => setExpandedIdx(null)}
        />
      )}
    </>
  );
}

function LightboxOverlay({
  image,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  onClose,
}: {
  image: GalleryImage;
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

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Prev arrow */}
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

      {/* Next arrow */}
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
        <img
          src={image.image_url}
          alt={image.caption ?? ""}
          className="w-full rounded-[var(--m-radius-sm)] object-contain max-h-[80vh]"
        />
        {image.caption && (
          <p className="text-white/70 text-sm text-center mt-3">{image.caption}</p>
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
