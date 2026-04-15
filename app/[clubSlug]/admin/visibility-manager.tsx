"use client";

import { useState, useTransition } from "react";
import { updateClubVisibility, type ClubVisibility } from "./actions";

const OPTIONS: { value: ClubVisibility; title: string; description: string }[] = [
  {
    value: "public",
    title: "Public",
    description: "Listed on osocios.club landing page, discover, and filters. Direct link works.",
  },
  {
    value: "unlisted",
    title: "Unlisted",
    description: "Hidden from discover and filters. Direct link still works — shareable for invites.",
  },
  {
    value: "private",
    title: "Private",
    description: "Fully hidden. Public profile page 404s. Owner onboards members manually from admin.",
  },
];

export function VisibilityManager({
  visibility,
  requestedVisibility,
  clubId,
  clubSlug,
}: {
  visibility: ClubVisibility;
  requestedVisibility: ClubVisibility;
  clubId: string;
  clubSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = requestedVisibility !== visibility;

  const handleChange = (next: ClubVisibility) => {
    setStatus(null);
    setError(null);
    startTransition(async () => {
      const res = await updateClubVisibility(clubId, next, clubSlug);
      if ("error" in res) {
        setError(res.error);
      } else if (res.pending) {
        setStatus(`Request to switch to "${next}" sent to platform admin for approval.`);
      } else {
        setStatus(`Visibility set to "${next}".`);
      }
    });
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Club visibility</h2>
        <span className="text-xs font-mono uppercase tracking-wide text-gray-500">
          current: {visibility}
        </span>
      </div>

      {pending && (
        <div className="mb-3 rounded border border-yellow-300 bg-yellow-50 p-2 text-xs text-yellow-800">
          Pending platform admin approval: <strong>{requestedVisibility}</strong>
        </div>
      )}

      <div className="space-y-2">
        {OPTIONS.map((opt) => {
          const selected = opt.value === visibility;
          const requested = opt.value === requestedVisibility && pending;
          return (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                selected
                  ? "border-green-500 bg-green-50"
                  : requested
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="visibility"
                value={opt.value}
                checked={selected}
                disabled={isPending}
                onChange={() => handleChange(opt.value)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{opt.title}</span>
                  {requested && !selected && (
                    <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-[10px] font-semibold text-yellow-900">
                      requested
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-600">{opt.description}</p>
              </div>
            </label>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-gray-500">
        Moving to a more private level takes effect immediately. Moving to a more public level requires
        platform admin approval.
      </p>

      {status && <p className="mt-2 text-xs text-green-700">{status}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
