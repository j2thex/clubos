"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { setNavAutohide } from "./actions";

export function NavAutohideManager({
  clubId,
  clubSlug,
  initialEnabled,
}: {
  clubId: string;
  clubSlug: string;
  initialEnabled: boolean;
}) {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    if (next === enabled) return;
    const previous = enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await setNavAutohide(clubId, next, clubSlug);
      if ("error" in result) {
        setEnabled(previous);
        toast.error(result.error);
        return;
      }
      toast.success(t("admin.layout.toastSaved"));
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <label className="flex items-start gap-3 px-5 py-4 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          disabled={isPending}
          onChange={(e) => handleToggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-900">
          {t("admin.layout.autohide.title")}
          <span className="block text-xs text-gray-500 mt-0.5">
            {t("admin.layout.autohide.desc")}
          </span>
        </span>
      </label>
    </div>
  );
}
