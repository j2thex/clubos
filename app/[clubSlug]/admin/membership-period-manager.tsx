"use client";

import { useState, useTransition } from "react";
import { addMembershipPeriod, deleteMembershipPeriod } from "./actions";

interface Period {
  id: string;
  name: string;
  duration_months: number;
}

export function MembershipPeriodManager({
  periods,
  clubId,
  clubSlug,
}: {
  periods: Period[];
  clubId: string;
  clubSlug: string;
}) {
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState("12");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!newName.trim()) return;
    setError(null);

    startTransition(async () => {
      const result = await addMembershipPeriod(clubId, newName, Number(newDuration), clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        setNewName("");
        setNewDuration("12");
      }
    });
  }

  function handleDelete(periodId: string) {
    startTransition(async () => {
      await deleteMembershipPeriod(periodId, clubSlug);
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        Membership Periods
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {periods.length > 0 && (
          <div className="divide-y divide-gray-100">
            {periods.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{p.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {p.duration_months} {p.duration_months === 1 ? "month" : "months"}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={isPending}
                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. Annual"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="120"
              value={newDuration}
              onChange={(e) => setNewDuration(e.target.value)}
              className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
            <span className="text-xs text-gray-400">mo</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={isPending || !newName.trim()}
            className="rounded-lg bg-gray-800 text-white px-3 py-1.5 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add
          </button>
        </div>

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
