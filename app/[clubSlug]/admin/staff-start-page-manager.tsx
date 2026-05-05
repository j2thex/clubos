"use client";

import { useState, useTransition } from "react";
import { setStaffStartingPage } from "./actions";
import { STAFF_START_PAGES } from "@/lib/staff-start-pages";

export function StaffStartPageManager({
  clubId,
  clubSlug,
  initialValue,
  opsEnabled,
}: {
  clubId: string;
  clubSlug: string;
  initialValue: string | null;
  opsEnabled: boolean;
}) {
  const [value, setValue] = useState<string>(initialValue ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const options = STAFF_START_PAGES.filter((p) => !p.requiresOps || opsEnabled);

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await setStaffStartingPage(clubId, value || null, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 py-4">
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        >
          <option value="">System default (Members)</option>
          {options.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-gray-400 mt-2">
          Where staff land after logging in. Defaults to Members.
        </p>
      </div>
      <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
        <div>
          {success && <span className="text-xs text-green-600 font-medium">Saved</span>}
          {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-gray-800 text-white px-5 py-1.5 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
