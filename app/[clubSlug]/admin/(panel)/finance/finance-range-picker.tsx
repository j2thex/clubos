"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/provider";
import type { RangePreset } from "@/lib/finance/range";

const PRESETS: RangePreset[] = ["today", "week", "month", "custom"];

export function FinanceRangePicker({
  current,
  from,
  to,
}: {
  current: RangePreset;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  function setRange(next: RangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", next);
    if (next !== "custom") {
      params.delete("from");
      params.delete("to");
    } else {
      // Seed with currently-displayed range so resolveRange doesn't fall back to month.
      if (!params.get("from")) params.set("from", from);
      if (!params.get("to")) params.set("to", to);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  function setCustom(field: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", "custom");
    params.set(field, value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-3 space-y-3">
      <div className="flex gap-1">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setRange(p)}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              current === p
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t(`finance.range.${p}`)}
          </button>
        ))}
      </div>
      {current === "custom" && (
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={from}
            onChange={(e) => setCustom("from", e.target.value)}
            style={{ colorScheme: "light" }}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
          <span className="text-sm text-gray-400">→</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setCustom("to", e.target.value)}
            style={{ colorScheme: "light" }}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-900"
          />
        </div>
      )}
    </div>
  );
}
