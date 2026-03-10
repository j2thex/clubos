"use client";

import { useState, useTransition } from "react";
import { createMember } from "./actions";

export function StaffMemberCreator({
  clubId,
  clubSlug,
  periods,
}: {
  clubId: string;
  clubSlug: string;
  periods: { id: string; name: string; duration_months: number }[];
}) {
  const [memberCode, setMemberCode] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await createMember(clubId, memberCode, clubSlug, selectedPeriodId || null);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`Member ${memberCode.toUpperCase()} created`);
        setMemberCode("");
        setSelectedPeriodId("");
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        Onboard New Member
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit}>
          <div className="px-5 py-4 flex gap-3 items-end">
            <div className="flex-1">
              <label htmlFor="staffMemberCode" className="block text-xs font-medium text-gray-500 mb-1">
                Member Code
              </label>
              <input
                id="staffMemberCode"
                type="text"
                value={memberCode}
                onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
                placeholder="ABC12"
                maxLength={6}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !memberCode.trim()}
              className="rounded-lg bg-gray-800 text-white px-5 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {isPending ? "..." : "Create"}
            </button>
          </div>
          {periods.length > 0 && (
            <div className="px-5 pb-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Membership Period
              </label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-white"
              >
                <option value="">No period</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.duration_months} {p.duration_months === 1 ? "month" : "months"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </form>

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="px-5 py-2 text-xs text-green-700 bg-green-50 border-t border-green-100">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
