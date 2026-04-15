"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/provider";

interface Props {
  open: boolean;
  questTitle: string;
  onClose: () => void;
  onUpload: (file: File) => void;
  onAskStaff: () => void;
  isPending: boolean;
}

export function QuestProofModal({
  open,
  questTitle,
  onClose,
  onUpload,
  onAskStaff,
  isPending,
}: Props) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPreviewName(null);
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewName(file.name);
    onUpload(file);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl sm:rounded-2xl shadow-2xl max-w-sm w-full max-h-[85svh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 space-y-4">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("offers.detail.close")}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-lg leading-none"
          >
            ×
          </button>

          <div className="text-center pt-2">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {t("quests.proof.chooseTitle")}
            </h2>
            <p className="text-xs text-gray-500 mt-1">{questTitle}</p>
          </div>

          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 text-center">
            {t("quests.proof.intro")}
          </p>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="w-full rounded-xl club-btn px-4 py-3 text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {previewName ?? t("quests.proof.upload")}
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              {t("quests.proof.uploadHint")}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">
              {t("common.or")}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onAskStaff}
              disabled={isPending}
              className="w-full rounded-xl bg-gray-100 text-gray-700 px-4 py-3 text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {t("quests.proof.askStaff")}
            </button>
            <p className="text-[11px] text-gray-400 text-center">
              {t("quests.proof.askStaffHint")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
