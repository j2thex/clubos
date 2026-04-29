"use client";

import { useState, useTransition } from "react";
import { addGalleryItem, deleteGalleryItem } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

type MediaType = "image" | "video" | "audio";

interface MediaItem {
  id: string;
  media_url: string;
  media_type: MediaType;
  mime_type: string | null;
  caption: string | null;
}

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif," +
  "video/mp4,video/quicktime,video/webm," +
  "audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm";

export function MediaManager({
  items,
  clubId,
  clubSlug,
}: {
  items: MediaItem[];
  clubId: string;
  clubSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    startTransition(async () => {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("media", file);
        const result = await addGalleryItem(clubId, fd, clubSlug);
        if ("error" in result) {
          setError(result.error);
          break;
        }
      }
    });

    e.target.value = "";
  }

  function handleDelete(itemId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteGalleryItem(itemId, clubSlug);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t("admin.gallery")}
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 space-y-3">
          {items.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => (
                <div key={item.id} className="relative group">
                  <MediaTile item={item} />
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={isPending}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {items.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">{t("admin.noMedia")}</p>
          )}

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <label className={`block w-full rounded-lg border-2 border-dashed border-gray-200 px-4 py-3 text-center cursor-pointer hover:border-gray-300 transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
            <span className="text-sm text-gray-500">
              {isPending ? t("admin.uploading") : t("admin.uploadMedia")}
            </span>
            <input
              type="file"
              accept={ACCEPT}
              multiple
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

function MediaTile({ item }: { item: MediaItem }) {
  if (item.media_type === "image") {
    return (
      <img
        src={item.media_url}
        alt={item.caption ?? ""}
        className="w-full aspect-square rounded-lg object-cover"
      />
    );
  }

  if (item.media_type === "video") {
    return (
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black">
        <video
          src={item.media_url}
          preload="metadata"
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
            <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full aspect-square rounded-lg bg-gray-100 flex flex-col items-center justify-center text-gray-500 px-2">
      <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-3c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
      </svg>
      <span className="text-[10px] uppercase tracking-wide">Audio</span>
    </div>
  );
}
