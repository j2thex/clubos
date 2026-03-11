"use client";

import { useState, useTransition } from "react";
import { submitQuest } from "./quest-actions";

interface Quest {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  image_url: string | null;
  reward_spins: number;
  multi_use: boolean;
  proof_mode: string | null;
  proof_placeholder: string | null;
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

  function handleMarkDone(quest: Quest) {
    const mode = quest.proof_mode ?? "none";
    if (mode === "none") {
      // No proof needed — submit immediately
      startTransition(async () => {
        await submitQuest(memberId, quest.id, clubSlug);
      });
    } else {
      // Show proof input
      setExpandedId(quest.id);
    }
  }

  function handleSubmit(quest: Quest) {
    const proof = proofUrls[quest.id]?.trim();
    if (quest.proof_mode === "required" && !proof) return;
    startTransition(async () => {
      await submitQuest(memberId, quest.id, clubSlug, proof || undefined);
      setProofUrls((prev) => { const next = { ...prev }; delete next[quest.id]; return next; });
      setExpandedId(null);
    });
  }

  return (
    <div className="space-y-3">
      {quests.map((q) => {
        const count = completionCounts[q.id] ?? 0;
        const done = count > 0;
        const isMultiUse = q.multi_use ?? false;
        const isPendingQuest = pendingSet.has(q.id);

        return (
          <div key={q.id} className="bg-white rounded-2xl shadow p-4 space-y-2">
            <div className="flex items-center gap-4">
              {q.image_url ? (
                <img src={q.image_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${done ? "club-tint-bg club-primary" : isPendingQuest ? "bg-yellow-50 text-yellow-500" : "bg-gray-100 text-gray-300"}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={done ? "M5 13l4 4L19 7" : isPendingQuest ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                </div>
              )}
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
                    Done
                  </span>
                ) : isPendingQuest ? (
                  <>
                    {isMultiUse && count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                        Done {count}x
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600">
                      Pending
                    </span>
                  </>
                ) : (
                  <>
                    {isMultiUse && count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                        Done {count}x
                      </span>
                    )}
                    <button
                      onClick={() => handleMarkDone(q)}
                      disabled={isPending}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      Mark done
                    </button>
                  </>
                )}
              </div>
            </div>
            {expandedId === q.id && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={proofUrls[q.id] ?? ""}
                  onChange={(e) => setProofUrls((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder={q.proof_placeholder || "Paste proof link"}
                  autoFocus
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
                />
                <button
                  onClick={() => handleSubmit(q)}
                  disabled={isPending || (q.proof_mode === "required" && !proofUrls[q.id]?.trim())}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {isPending ? "..." : "Submit"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
