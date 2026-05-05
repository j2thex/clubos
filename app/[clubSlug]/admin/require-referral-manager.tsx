"use client";

import { useState, useTransition } from "react";
import { setRequireReferralCode } from "./actions";

export function RequireReferralManager({
  clubId,
  clubSlug,
  initialValue,
}: {
  clubId: string;
  clubSlug: string;
  initialValue: boolean;
}) {
  const [enabled, setEnabled] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle(next: boolean) {
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      const result = await setRequireReferralCode(clubId, next, clubSlug);
      if ("error" in result) {
        setError(result.error);
        setEnabled(!next);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <label className="flex items-center justify-between px-5 py-4 cursor-pointer">
        <div>
          <p className="text-sm font-medium text-gray-900">Require referral on staff member create</p>
          <p className="text-xs text-gray-500 mt-0.5">
            When on, the referral field is required when staff manually create a member.
          </p>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => handleToggle(e.target.checked)}
          disabled={isPending}
          className="h-5 w-5 rounded border-gray-300 text-gray-700 focus:ring-gray-400"
        />
      </label>
      {error && (
        <div className="px-5 py-2 bg-red-50 border-t border-red-100 text-xs text-red-700">{error}</div>
      )}
    </div>
  );
}
