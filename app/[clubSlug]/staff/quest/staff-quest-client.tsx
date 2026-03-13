"use client";

import { useState, useTransition } from "react";
import { lookupMemberQuests, completeQuest, approveQuest, declineQuest } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

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
  proof_url: string | null;
}

type ItemFeedback =
  | { type: "approved"; message: string; memberCode: string }
  | { type: "declined" }
  | { type: "error"; message: string };

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
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successMemberCode, setSuccessMemberCode] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [pendingReferralCodes, setPendingReferralCodes] = useState<Record<string, string>>({});
  const [pendingQuests, setPendingQuests] = useState(initialPending);
  const [itemFeedback, setItemFeedback] = useState<Record<string, ItemFeedback>>({});

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
      setError(t("staff.enterReferredCode"));
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
      setSuccess(t("staff.questCompleted", { spins: quest?.reward_spins ?? 0, balance: res.newBalance }));
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
        setItemFeedback((prev) => ({ ...prev, [pendingId]: { type: "error", message: t("staff.enterReferredCode") } }));
        return;
      }
    }
    setItemFeedback((prev) => { const next = { ...prev }; delete next[pendingId]; return next; });
    startTransition(async () => {
      const pq = pendingQuests.find((p) => p.id === pendingId);
      const refCode = questType === "referral" ? (pendingReferralCodes[pendingId] ?? "").trim().toUpperCase() : undefined;
      const res = await approveQuest(pendingId, staffMemberId, clubSlug, refCode);
      if ("error" in res) {
        setItemFeedback((prev) => ({ ...prev, [pendingId]: { type: "error", message: res.error } }));
        return;
      }
      setItemFeedback((prev) => ({
        ...prev,
        [pendingId]: {
          type: "approved",
          message: `+${res.rewardSpins} spin${res.rewardSpins === 1 ? "" : "s"} awarded`,
          memberCode: pq?.member_code ?? "",
        },
      }));
      setPendingQuests((prev) => prev.filter((p) => p.id !== pendingId));
      setPendingReferralCodes((prev) => {
        const next = { ...prev };
        delete next[pendingId];
        return next;
      });
    });
  }

  function handleDecline(pendingId: string) {
    setItemFeedback((prev) => { const next = { ...prev }; delete next[pendingId]; return next; });
    startTransition(async () => {
      const res = await declineQuest(pendingId, staffMemberId, clubSlug);
      if ("error" in res) {
        setItemFeedback((prev) => ({ ...prev, [pendingId]: { type: "error", message: res.error } }));
        return;
      }
      setItemFeedback((prev) => ({ ...prev, [pendingId]: { type: "declined" } }));
      setPendingQuests((prev) => prev.filter((p) => p.id !== pendingId));
    });
  }

  // Items to render: pending quests + any resolved items that still have feedback
  const feedbackOnlyIds = Object.keys(itemFeedback).filter(
    (id) => !pendingQuests.some((pq) => pq.id === id) && itemFeedback[id].type !== "error",
  );
  const hasPendingSection = pendingQuests.length > 0 || feedbackOnlyIds.length > 0;

  const completableQuests = activeMember?.quests.filter((q) => q.multi_use || q.completionCount === 0) ?? [];
  const doneQuests = activeMember?.quests.filter((q) => !q.multi_use && q.completionCount > 0) ?? [];

  return (
    <div className="space-y-6">
      {/* Pending Validations */}
      {hasPendingSection && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {t("staff.pendingValidations", { count: pendingQuests.length })}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {/* Resolved feedback rows (approved/declined items already removed from pendingQuests) */}
            {feedbackOnlyIds.map((id) => {
              const fb = itemFeedback[id];
              if (fb.type === "approved") {
                return (
                  <div key={id} className="px-5 py-3 bg-green-50 flex items-center justify-between">
                    <span className="text-xs text-green-700 font-medium">{t("staff.questApproved", { message: fb.message })}</span>
                    {fb.memberCode && (
                      <a
                        href={`/${clubSlug}/staff/?member=${fb.memberCode}`}
                        className="ml-3 rounded-lg bg-gray-800 text-white px-3 py-1 text-xs font-semibold hover:bg-gray-700 transition-colors shrink-0"
                      >
                        {t("nav.spin")}
                      </a>
                    )}
                  </div>
                );
              }
              if (fb.type === "declined") {
                return (
                  <div key={id} className="px-5 py-3 bg-gray-50">
                    <span className="text-xs text-gray-500 font-medium">{t("staff.questDeclined")}</span>
                  </div>
                );
              }
              return null;
            })}
            {/* Active pending items */}
            {pendingQuests.map((pq) => {
              const fb = itemFeedback[pq.id];
              return (
                <div key={pq.id} className="px-5 py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{pq.quest_title}</p>
                      <p className="text-xs text-gray-400">
                        <span className="font-mono font-bold">{pq.member_code}</span>
                        {pq.member_name && ` — ${pq.member_name}`}
                      </p>
                      {pq.proof_url && (
                        /^https?:\/\//.test(pq.proof_url) ? (
                          <a
                            href={pq.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block mt-0.5 text-xs font-medium text-blue-600 underline truncate max-w-[200px]"
                          >
                            {pq.proof_url}
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(pq.proof_url!)}
                            className="inline-flex items-center gap-1 mt-0.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                            title="Click to copy"
                          >
                            <span className="font-mono">{pq.proof_url}</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )
                      )}
                    </div>
                    <button
                      onClick={() => handleDecline(pq.id)}
                      disabled={isPending}
                      className="rounded-lg border border-gray-300 text-gray-500 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors shrink-0"
                    >
                      {t("staff.declineQuest")}
                    </button>
                    <button
                      onClick={() => handleApprove(pq.id, pq.quest_type)}
                      disabled={isPending}
                      className="rounded-lg bg-green-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
                    >
                      {t("staff.approveQuest", { spins: pq.reward_spins })}
                    </button>
                  </div>
                  {pq.quest_type === "referral" && (
                    <input
                      type="text"
                      value={pendingReferralCodes[pq.id] ?? ""}
                      onChange={(e) => setPendingReferralCodes((prev) => ({ ...prev, [pq.id]: e.target.value.toUpperCase() }))}
                      placeholder={t("staff.referredCodePlaceholder")}
                      maxLength={6}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition text-center"
                    />
                  )}
                  {fb?.type === "error" && (
                    <p className="text-xs text-red-600">{fb.message}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quest Completion */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {t("staff.questCompletion")}
          </h3>
        </div>

        <form onSubmit={handleLookup} className="px-5 py-4 flex gap-3 items-end">
          <div className="flex-1">
            <label htmlFor="questMemberCode" className="block text-xs font-medium text-gray-500 mb-1">
              {t("staff.memberCodeLabel")}
            </label>
            <input
              id="questMemberCode"
              type="text"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
              placeholder={t("staff.memberCodePlaceholder")}
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition text-center"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !memberCode.trim()}
            className="rounded-lg bg-gray-800 text-white px-6 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            {isPending ? "..." : t("common.check")}
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
                {t("nav.spin")}
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
                            ? t("quest.doneCount", { count: q.completionCount })
                            : `+${q.reward_spins} ${q.reward_spins === 1 ? t("common.spin") : t("common.spins")}`}
                        </p>
                      </div>
                      <button
                        onClick={() => handleComplete(q.id, q.quest_type)}
                        disabled={isPending}
                        className="rounded-lg bg-green-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
                      >
                        {t("staff.completeQuest", { spins: q.reward_spins })}
                      </button>
                    </div>
                    {q.quest_type === "referral" && (
                      <div>
                        <input
                          type="text"
                          value={referralCode}
                          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                          placeholder={t("staff.referredCodePlaceholder")}
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
                {t("staff.allQuestsCompleted")}
              </div>
            )}

            {doneQuests.length > 0 && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {doneQuests.map((q) => (
                  <div key={q.id} className="px-5 py-2 flex items-center gap-3 opacity-50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">{q.title}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium">{t("common.done")}</span>
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
