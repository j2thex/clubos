"use client";

import { useState, useTransition } from "react";
import { setLegalMembershipText } from "./actions";

export function LegalTextManager({
  clubId,
  clubSlug,
  initialText,
}: {
  clubId: string;
  clubSlug: string;
  initialText: string | null;
}) {
  const [text, setText] = useState<string>(initialText ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await setLegalMembershipText(clubId, text, clubSlug);
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
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Paste the consent / membership terms shown on the signed PDF for every new member."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        />
        <p className="text-[11px] text-gray-400 mt-2">
          Generated as a PDF on staff member onboarding. Leave blank to skip PDF generation.
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
