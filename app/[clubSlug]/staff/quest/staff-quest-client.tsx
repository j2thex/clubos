"use client";

import { useState, useTransition } from "react";
import { lookupMemberQuests, completeQuest, approveQuest } from "./actions";

interface Quest {
  id: string;
  title: string;
  reward_spins: number;
  quest_type: string;
}

interface PendingQuest {
  id: string;
  quest_title: string;
  member_code: string;
  member_name: string | null;
  reward_spins: number;
  quest_type: string;
  completed_at: string;
}

export function StaffQuestClient({
  clubId,
  clubSlug,
  quests,
  staffMemberId,
  pendingQuests: initialPending,
}: {
  clubId: string;
  clubSlug: string;
  quests: Quest[];
  staffMemberId: string;
  pendingQuests: PendingQuest[];
}) {
  const [memberCode, setMemberCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successMemberCode, setSuccessMemberCode] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [pendingReferralCodes, setPendingReferralCodes] = useState<Record<string, string>>({});
  const [pendingQuests, setPendingQuests] = useState(initialPending);

  const [activeMember, setActiveMember] = useState<{
    id: string;
    code: string;
    quests: { id: string; title: string; reward_spins: number; multi_use: boolean; quest_type: string; completionCount: number }[];
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

  function handleComplete(questId: string, questType: string) {
    if (!activeMember) return;
    if (questType === "referral" && !referralCode.trim()) {
      setError("Please enter the referred member's code");
      return;
    }
    setError(null);
    setSuccess(null);
    setSuccessMemberCode(null);
    startTransition(async () => {
      const res = await completeQuest(
        activeMember.id,
        questId,
        staffMemberId,
        questType === "referral" ? referralCode.trim().toUpperCase() : undefined,
      );
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const quest = activeMember.quests.find((q) => q.id === questId);
      setSuccess(`Quest completed! +${quest?.reward_spins ?? 0} spin${(quest?.reward_spins ?? 0) === 1 ? "" : "s"} awarded (balance: ${res.newBalance})`);
      setSuccessMemberCode(activeMember.code);
      setReferralCode("");
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

  function handleApprove(pendingId: string, questType: string) {
    if (questType === "referral") {
      const code = (pendingReferralCodes[pendingId] ?? "").trim();
      if (!code) {
        setError("Please enter the referred member's code");
        return;
      }
    }
    setError(null);
    setSuccess(null);
    setSuccessMemberCode(null);
    startTransition(async () => {
      const pq = pendingQuests.find((p) => p.id === pendingId);
      const refCode = questType === "referral" ? (pendingReferralCodes[pendingId] ?? "").trim().toUpperCase() : undefined;
      const res = await approveQuest(pendingId, staffMemberId, clubSlug, refCode);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setSuccess(`Quest approved! +${res.rewardSpins} spin${res.rewardSpins === 1 ? "" : "s"} awarded`);
      setSuccessMemberCode(pq?.member_code ?? null);
      setPendingQuests((prev) => prev.filter((p) => p.id !== pendingId));
      setPendingReferralCodes((prev) => {
        const next = { ...prev };
        delete next[pendingId];
        return next;
      });
    });
  }

  const completableQuests = activeMember?.quests.filter((q) => q.multi_use || q.completionCount === 0) ?? [];
  const doneQuests = activeMember?.quests.filter((q) => !q.multi_use && q.completionCount > 0) ?? [];

  return (
    <div className="space-y-6">
      {/* Pending Validations */}
      {pendingQuests.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Pending Validations ({pendingQuests.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {pendingQuests.map((pq) => (
              <div key={pq.id} className="px-5 py-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{pq.quest_title}</p>
                    <p className="text-xs text-gray-400">
                      <span className="font-mono font-bold">{pq.member_code}</span>
                      {pq.member_name && ` — ${pq.member_name}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApprove(pq.id, pq.quest_type)}
                    disabled={isPending}
                    className="rounded-lg bg-green-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
                  >
                    Approve +{pq.reward_spins}
                  </button>
                </div>
                {pq.quest_type === "referral" && (
                  <input
                    type="text"
                    value={pendingReferralCodes[pq.id] ?? ""}
                    onChange={(e) => setPendingReferralCodes((prev) => ({ ...prev, [pq.id]: e.target.value.toUpperCase() }))}
                    placeholder="Referred member code"
                    maxLength={6}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-center"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quest Completion */}
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
          <div className="px-5 py-2 text-xs text-green-700 bg-green-50 border-t border-green-100 flex items-center justify-between">
            <span>{success}</span>
            {successMemberCode && (
              <a
                href={`/${clubSlug}/staff/?member=${successMemberCode}`}
                className="ml-3 rounded-lg bg-gray-800 text-white px-3 py-1 text-xs font-semibold hover:bg-gray-700 transition-colors shrink-0"
              >
                Spin
              </a>
            )}
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
                  <div key={q.id} className="px-5 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{q.title}</p>
                        <p className="text-xs text-gray-400">
                          {q.multi_use && q.completionCount > 0
                            ? `Done ${q.completionCount}x`
                            : `+${q.reward_spins} spin${q.reward_spins === 1 ? "" : "s"}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleComplete(q.id, q.quest_type)}
                        disabled={isPending}
                        className="rounded-lg bg-green-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
                      >
                        Complete +{q.reward_spins}
                      </button>
                    </div>
                    {q.quest_type === "referral" && (
                      <div>
                        <input
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder="Referred member code"
                          maxLength={6}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-center"
                        />
                      </div>
                    )}
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
    </div>
  );
}
