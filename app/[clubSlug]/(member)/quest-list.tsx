"use client";

import { useTransition } from "react";
import { submitQuest } from "./quest-actions";

interface Quest {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  image_url: string | null;
  reward_spins: number;
  multi_use: boolean;
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
  const pendingSet = new Set(pendingQuestIds);

  function handleSubmit(questId: string) {
    startTransition(async () => {
      await submitQuest(memberId, questId, clubSlug);
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
          <div key={q.id} className="bg-white rounded-2xl shadow p-4 flex items-center gap-4">
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
              {q.link && (!done || isMultiUse) && !isPendingQuest && (
                <a
                  href={q.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-1 text-xs font-medium club-primary underline"
                >
                  Open link
                </a>
              )}
            </div>
            <div className="shrink-0">
              {done ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                  {isMultiUse ? `Done ${count}x` : "Done"}
                </span>
              ) : isPendingQuest ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600">
                  Pending
                </span>
              ) : (
                <button
                  onClick={() => handleSubmit(q.id)}
                  disabled={isPending}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Mark done
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
