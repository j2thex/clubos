"use client";

import { useState, useTransition } from "react";
import { submitQuest } from "./quest-actions";
import { useLanguage } from "@/lib/i18n/provider";
import { DynamicIcon } from "@/components/dynamic-icon";

interface Quest {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  image_url: string | null;
  icon: string | null;
  reward_spins: number;
  multi_use: boolean;
  quest_type: string | null;
  proof_mode: string | null;
  proof_placeholder: string | null;
  tutorial_steps: string[] | null;
}

export function QuestList({
  quests,
  completionCounts,
  pendingQuestIds,
  memberId,
  clubSlug,
}: {
  quests: Quest[];
  completionCounts: Record<string, number>;
  pendingQuestIds: string[];
  memberId: string;
  clubSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pendingSet = new Set(pendingQuestIds);
  const { t } = useLanguage();

  function handleMarkDone(quest: Quest) {
    const mode = quest.proof_mode ?? "none";
    const qType = quest.quest_type ?? "default";
    // Feedback quests always expand for text input
    if (qType === "feedback" || (mode !== "none" && qType !== "tutorial")) {
      setExpandedId(quest.id);
    } else {
      // No proof needed — submit immediately
      startTransition(async () => {
        await submitQuest(memberId, quest.id, clubSlug);
      });
    }
  }

  function handleSubmit(quest: Quest) {
    const proof = proofUrls[quest.id]?.trim();
    const qType = quest.quest_type ?? "default";
    // Feedback requires text; default respects proof_mode
    if ((qType === "feedback" || quest.proof_mode === "required") && !proof) return;
    startTransition(async () => {
      await submitQuest(memberId, quest.id, clubSlug, proof || undefined);
      setProofUrls((prev) => { const next = { ...prev }; delete next[quest.id]; return next; });
      setExpandedId(null);
    });
  }

  function renderIcon(quest: Quest, done: boolean, isPendingQuest: boolean) {
    if (quest.image_url) {
      return <img src={quest.image_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />;
    }

    const qType = quest.quest_type ?? "default";
    const baseClass = `w-10 h-10 rounded-full flex items-center justify-center shrink-0`;
    const colorClass = done ? "club-tint-bg club-primary" : isPendingQuest ? "bg-yellow-50 text-yellow-500" : "bg-gray-100 text-gray-300";

    // Use custom icon if set by admin
    if (quest.icon) {
      return (
        <div className={`${baseClass} ${colorClass}`}>
          <DynamicIcon name={quest.icon} className="w-5 h-5" />
        </div>
      );
    }

    if (qType === "feedback") {
      return (
        <div className={`${baseClass} ${colorClass}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      );
    }

    if (qType === "tutorial") {
      return (
        <div className={`${baseClass} ${colorClass}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      );
    }

    return (
      <div className={`${baseClass} ${colorClass}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={done ? "M5 13l4 4L19 7" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {quests.map((q) => {
        const count = completionCounts[q.id] ?? 0;
        const done = count > 0;
        const isMultiUse = q.multi_use ?? false;
        const isPendingQuest = pendingSet.has(q.id);
        const qType = q.quest_type ?? "default";
        const isFeedback = qType === "feedback";
        const isTutorial = qType === "tutorial";

        return (
          <div key={q.id} className="bg-white rounded-2xl shadow p-4 space-y-2">
            <div className="flex items-center gap-4">
              {renderIcon(q, done, isPendingQuest)}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{q.title}</p>
                {q.description && (
                  <p className="text-xs text-gray-400">{q.description}</p>
                )}
                {q.link && (() => {
                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.link!);
                  const href = isEmail
                    ? `mailto:${q.link}`
                    : q.link!.match(/^https?:\/\//) ? q.link! : `https://${q.link}`;
                  const display = isEmail
                    ? q.link!
                    : q.link!.replace(/^https?:\/\//, "").replace(/\/$/, "");
                  return (
                    <a
                      href={href}
                      target={isEmail ? undefined : "_blank"}
                      rel={isEmail ? undefined : "noopener noreferrer"}
                      className="inline-block mt-1 text-xs font-medium club-primary underline truncate max-w-[200px]"
                    >
                      {display.length > 40 ? `${display.slice(0, 37)}...` : display}
                    </a>
                  );
                })()}
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                {done && !isMultiUse ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                    {t("quest.done")}
                  </span>
                ) : isPendingQuest ? (
                  <>
                    {isMultiUse && count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                        {t("quest.doneCount", { count })}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600">
                      {t("quest.pending")}
                    </span>
                  </>
                ) : (
                  <>
                    {isMultiUse && count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                        {t("quest.doneCount", { count })}
                      </span>
                    )}
                    <button
                      onClick={() => handleMarkDone(q)}
                      disabled={isPending}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      {isFeedback ? t("quest.shareFeedback") : t("quest.markDone")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tutorial steps display */}
            {isTutorial && q.tutorial_steps && q.tutorial_steps.length > 0 && (
              <div className="pl-14">
                <p className="text-xs font-medium text-gray-500 mb-1">{t("quest.tutorialSteps")}</p>
                <ol className="space-y-0.5">
                  {q.tutorial_steps.map((step, i) => (
                    <li key={i} className="text-xs text-gray-400 flex gap-1.5">
                      <span className="text-gray-300 shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Feedback textarea or proof input */}
            {expandedId === q.id && (
              <div className="flex gap-2">
                {isFeedback ? (
                  <textarea
                    value={proofUrls[q.id] ?? ""}
                    onChange={(e) => setProofUrls((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder={q.proof_placeholder || t("quest.feedbackPlaceholder")}
                    autoFocus
                    rows={3}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={proofUrls[q.id] ?? ""}
                    onChange={(e) => setProofUrls((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder={q.proof_placeholder || t("quest.proofPlaceholder")}
                    autoFocus
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
                  />
                )}
                <button
                  onClick={() => handleSubmit(q)}
                  disabled={isPending || ((isFeedback || q.proof_mode === "required") && !proofUrls[q.id]?.trim())}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors shrink-0 self-end"
                >
                  {isPending ? "..." : t("common.submit")}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
