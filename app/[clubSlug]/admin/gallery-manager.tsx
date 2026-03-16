"use client";

import { useState, useTransition } from "react";
import { addGalleryImage, deleteGalleryImage } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

interface GalleryImage {
  id: string;
  image_url: string;
  caption: string | null;
}

export function GalleryManager({
  images,
  clubId,
  clubSlug,
}: {
  images: GalleryImage[];
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
        fd.set("image", file);
        const result = await addGalleryImage(clubId, fd, clubSlug);
        if ("error" in result) {
          setError(result.error);
          break;
        }
      }
    });

    // Reset input
    e.target.value = "";
  }

  function handleDelete(imageId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteGalleryImage(imageId, clubSlug);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t("admin.photoGallery")}
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 space-y-3">
          {/* Image grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.image_url}
                    alt={img.caption ?? ""}
                    className="w-full aspect-square rounded-lg object-cover"
                  />
                  <button
                    onClick={() => handleDelete(img.id)}
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

          {images.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">{t("admin.noPhotos")}</p>
          )}

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {/* Upload */}
          <label className={`block w-full rounded-lg border-2 border-dashed border-gray-200 px-4 py-3 text-center cursor-pointer hover:border-gray-300 transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
            <span className="text-sm text-gray-500">
              {isPending ? t("admin.uploading") : t("admin.uploadPhotos")}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
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
