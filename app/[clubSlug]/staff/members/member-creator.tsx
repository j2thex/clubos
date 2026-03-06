"use client";

import { useState, useTransition } from "react";
import { createMember } from "./actions";

export function StaffMemberCreator({
  clubId,
  clubSlug,
}: {
  clubId: string;
  clubSlug: string;
}) {
  const [memberCode, setMemberCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await createMember(clubId, memberCode, pin, clubSlug);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(`Member ${memberCode.toUpperCase()} created`);
        setMemberCode("");
        setPin("");
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
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
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
            <div>
              <label htmlFor="staffPin" className="block text-xs font-medium text-gray-500 mb-1">
                PIN
              </label>
              <input
                id="staffPin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]{4}"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm tracking-widest text-center text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || !memberCode.trim() || !pin.trim()}
            className="w-full rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Creating..." : "Create Member"}
          </button>
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
