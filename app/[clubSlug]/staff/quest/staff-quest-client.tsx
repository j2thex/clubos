"use client";

import { useState, useTransition } from "react";
import { lookupMemberQuests, completeQuest } from "./actions";

interface Quest {
  id: string;
  title: string;
  reward_spins: number;
}

export function StaffQuestClient({
  clubId,
  quests,
  staffMemberId,
}: {
  clubId: string;
  quests: Quest[];
  staffMemberId: string;
}) {
  const [memberCode, setMemberCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [activeMember, setActiveMember] = useState<{
    id: string;
    code: string;
    quests: { id: string; title: string; reward_spins: number; multi_use: boolean; completionCount: number }[];
  } | null>(null);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const code = memberCode.trim().toUpperCase();
    if (!code) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await lookupMemberQuests(code, clubId);
      if ("error" in res) {
        setError(res.error);
        setActiveMember(null);
        return;
      }
      setActiveMember({
        id: res.memberId,
        code: res.memberCode,
        quests: res.quests,
      });
    });
  }

  function handleComplete(questId: string) {
    if (!activeMember) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await completeQuest(activeMember.id, questId, staffMemberId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const quest = activeMember.quests.find((q) => q.id === questId);
      setSuccess(`Quest completed! +${quest?.reward_spins ?? 0} spin${(quest?.reward_spins ?? 0) === 1 ? "" : "s"} awarded (balance: ${res.newBalance})`);
      // Update completion count locally
      setActiveMember((prev) =>
        prev
          ? {
              ...prev,
              quests: prev.quests.map((q) =>
                q.id === questId ? { ...q, completionCount: q.completionCount + 1 } : q,
              ),
            }
          : null,
      );
    });
  }

  // Completable: not yet done, or multi-use (always completable)
  const completableQuests = activeMember?.quests.filter((q) => q.multi_use || q.completionCount === 0) ?? [];
  // Done: single-use and completed (not shown as completable)
  const doneQuests = activeMember?.quests.filter((q) => !q.multi_use && q.completionCount > 0) ?? [];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Quest Completion
        </h3>
      </div>

      <form onSubmit={handleLookup} className="px-5 py-4 flex gap-3 items-end">
        <div className="flex-1">
          <label htmlFor="questMemberCode" className="block text-xs font-medium text-gray-500 mb-1">
            Member Code
          </label>
          <input
            id="questMemberCode"
            type="text"
            value={memberCode}
            onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
            placeholder="ABC12"
            maxLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition text-center"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !memberCode.trim()}
          className="rounded-lg bg-gray-800 text-white px-6 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {isPending ? "..." : "Check"}
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

      {activeMember && (
        <div className="border-t border-gray-100">
          <div className="px-5 py-2 bg-gray-50">
            <p className="text-sm text-gray-900">
              <span className="font-mono font-bold">{activeMember.code}</span>
            </p>
          </div>

          {completableQuests.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {completableQuests.map((q) => (
                <div key={q.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{q.title}</p>
                    <p className="text-xs text-gray-400">
                      {q.multi_use && q.completionCount > 0
                        ? `Done ${q.completionCount}x`
                        : `+${q.reward_spins} spin${q.reward_spins === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleComplete(q.id)}
                    disabled={isPending}
                    className="rounded-lg bg-green-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    Complete +{q.reward_spins}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-4 text-sm text-gray-400 text-center">
              All quests completed
            </div>
          )}

          {doneQuests.length > 0 && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {doneQuests.map((q) => (
                <div key={q.id} className="px-5 py-2 flex items-center gap-3 opacity-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">{q.title}</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Done</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
