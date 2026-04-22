"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { setMonthlyConsumptionLimit } from "./actions";

export function ConsumptionLimitManager({
  clubId,
  clubSlug,
  initialLimitGrams,
}: {
  clubId: string;
  clubSlug: string;
  initialLimitGrams: number | null;
}) {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(initialLimitGrams !== null);
  const [value, setValue] = useState<string>(
    initialLimitGrams !== null ? String(initialLimitGrams) : "",
  );
  const [saved, setSaved] = useState<number | null>(initialLimitGrams);
  const [isPending, startTransition] = useTransition();

  const parsed = value === "" ? NaN : Number(value);
  const valid = enabled ? Number.isFinite(parsed) && parsed > 0 : true;
  const dirty = enabled
    ? !Number.isFinite(parsed) ? saved !== null : parsed !== saved
    : saved !== null;

  function handleSave() {
    if (!valid) return;
    const next: number | null = enabled ? parsed : null;
    startTransition(async () => {
      const result = await setMonthlyConsumptionLimit(clubId, next, clubSlug);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setSaved(next);
      toast.success(
        next === null
          ? t("ops.admin.consumptionLimit.toastDisabled")
          : t("ops.admin.consumptionLimit.toastSaved"),
      );
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="px-4 py-3 space-y-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {t("ops.admin.consumptionLimit.title")}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("ops.admin.consumptionLimit.desc")}
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            disabled={isPending}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-900">
            {t("ops.admin.consumptionLimit.enableLabel")}
          </span>
        </label>

        {enabled && (
          <label className="block">
            <span className="text-xs text-gray-700">
              {t("ops.admin.consumptionLimit.inputLabel")}
            </span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                step="0.001"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm tabular-nums text-right"
                placeholder="100"
              />
              <span className="text-sm text-gray-500">g</span>
            </div>
            {!valid && (
              <p className="text-[11px] text-red-600 mt-1">
                {t("ops.admin.consumptionLimit.invalid")}
              </p>
            )}
          </label>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={!valid || !dirty || isPending}
            className="rounded-lg bg-gray-900 text-white text-sm font-semibold px-4 py-2 disabled:opacity-50"
          >
            {isPending ? "…" : t("ops.admin.consumptionLimit.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
