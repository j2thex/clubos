"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { toggleOperationsModule } from "./actions";

export function OperationsModuleManager({
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
    const previous = enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await toggleOperationsModule(clubId, next, clubSlug);
      if ("error" in result) {
        setEnabled(previous);
        toast.error(result.error);
        return;
      }
      toast.success(t(next ? "ops.admin.toastEnabled" : "ops.admin.toastDisabled"));
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 py-4 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            disabled={isPending}
            onChange={(e) => handleToggle(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-900">
            {t("ops.admin.enableLabel")}
            <span className="block text-xs text-gray-500 mt-0.5">
              {t("ops.admin.enableDesc")}
            </span>
          </span>
        </label>

        {enabled && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
            {t("ops.admin.warning")}
          </div>
        )}
      </div>
    </div>
  );
}
