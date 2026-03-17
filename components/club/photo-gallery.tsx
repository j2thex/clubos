"use client";

import { useState } from "react";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
}

export function PhotoGallery({ images }: { images: GalleryImage[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (images.length === 0) return null;

  const expanded = images.find((i) => i.id === expandedId);

  return (
    <>
      <div className="-mx-4 px-4">
        <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => setExpandedId(img.id)}
              className="snap-start shrink-0 w-32 h-32 rounded-xl overflow-hidden"
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
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setExpandedId(null)}
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={expanded.image_url}
              alt={expanded.caption ?? ""}
              className="w-full rounded-xl object-contain max-h-[80vh]"
            />
            {expanded.caption && (
              <p className="text-white/70 text-sm text-center mt-3">{expanded.caption}</p>
            )}
            <button
              onClick={() => setExpandedId(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
