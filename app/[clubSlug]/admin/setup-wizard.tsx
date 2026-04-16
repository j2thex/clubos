"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DynamicIcon } from "@/components/dynamic-icon";
import {
  generateSetupDraftAction,
  saveSetupDraftAction,
} from "./ai-actions";
import type { SetupDraft } from "@/lib/ai/schemas";

const CATEGORY_LABELS: Record<string, string> = {
  social: "Social",
  activity: "Activity",
  boost: "Boost",
  level_up: "Level Up",
};

export function SetupWizard({
  clubId,
  clubSlug,
  clubName,
}: {
  clubId: string;
  clubSlug: string;
  clubName: string;
}) {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [draft, setDraft] = useState<SetupDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSave] = useTransition();

  async function handleGenerate() {
    if (loading || prompt.trim().length < 10) return;
    setError(null);
    setLoading(true);
    try {
      const result = await generateSetupDraftAction(clubId, prompt);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setDraft(result.draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!draft) return;
    setError(null);
    startSave(async () => {
      const result = await saveSetupDraftAction(clubId, clubSlug, draft);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      // Route back to the content hub and let the existing list re-render.
      router.push(`/${clubSlug}/admin/content?setup=${result.questCount},${result.eventCount}`);
      router.refresh();
    });
  }

  function handleDiscard() {
    setDraft(null);
    setError(null);
  }

  // --- PREVIEW STATE ---
  if (draft) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            ✨ Starter kit for {clubName}
          </h2>
          <p className="text-sm text-gray-600 mt-2">{draft.overview}</p>
          <p className="text-xs text-gray-400 mt-3">
            Review below. Everything is saved as <strong>inactive</strong> and not public, so nothing goes live until you flip toggles on the individual quest / event pages.
          </p>
        </div>

        {/* Quest cards */}
        {draft.quests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Quests ({draft.quests.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {draft.quests.map((q, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    {q.icon ? (
                      <DynamicIcon name={q.icon} className="w-5 h-5 text-gray-500" />
                    ) : (
                      <span className="text-xs text-gray-400">?</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{q.title}</p>
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {CATEGORY_LABELS[q.category] ?? q.category}
                      </span>
                      <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">
                        {q.reward_spins} {q.reward_spins === 1 ? "spin" : "spins"}
                      </span>
                      {q.quest_type !== "default" && (
                        <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full">
                          {q.quest_type}
                        </span>
                      )}
                    </div>
                    {q.description && (
                      <p className="text-xs text-gray-600 mt-0.5">{q.description}</p>
                    )}
                    {q.description_es && (
                      <p className="text-[11px] text-gray-400 italic mt-0.5">ES: {q.description_es}</p>
                    )}
                    {q.tutorial_steps && q.tutorial_steps.length > 0 && (
                      <ol className="text-xs text-gray-500 mt-1 list-decimal list-inside space-y-0.5">
                        {q.tutorial_steps.map((step, j) => (
                          <li key={j}>{step}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Event cards */}
        {draft.events.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Events ({draft.events.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {draft.events.map((e, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    {e.icon ? (
                      <DynamicIcon name={e.icon} className="w-5 h-5 text-gray-500" />
                    ) : (
                      <span className="text-xs text-gray-400">?</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{e.title}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      {e.date && (
                        <span className="text-[11px] text-gray-500">
                          📅 {e.date}
                          {e.time && ` · ${e.time}`}
                          {e.end_time && `–${e.end_time}`}
                        </span>
                      )}
                      {e.price != null && (
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          {e.price === 0 ? "Free" : `${e.price}€`}
                        </span>
                      )}
                      {e.location_name && (
                        <span className="text-[11px] text-gray-500">📍 {e.location_name}</span>
                      )}
                    </div>
                    {!e.date && (
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        ⚠ No date — will default to next Saturday. Edit after save.
                      </p>
                    )}
                    {e.description && (
                      <p className="text-xs text-gray-600 mt-1">{e.description}</p>
                    )}
                    {e.description_es && (
                      <p className="text-[11px] text-gray-400 italic mt-0.5">ES: {e.description_es}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 rounded-lg bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving…" : "Save all"}
          </button>
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Discard & try again
          </button>
        </div>
      </div>
    );
  }

  // --- INPUT STATE ---
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          ✨ AI setup for {clubName}
        </h1>
        <p className="text-sm text-gray-600">
          Describe your club in a few sentences — the vibe, what you want members to do, any upcoming events. The AI will draft a starter kit of quests and events. Nothing is saved until you approve.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Underground DJ community in Madrid. We host Saturday parties and run monthly vinyl workshops. I want members to follow us on Instagram, leave a Google review after their first visit, and check in at events. Brand is raw red / black."
          rows={8}
          disabled={loading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-y disabled:opacity-50"
        />
        {error && (
          <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">
            {error}
          </div>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || prompt.trim().length < 10}
          className="w-full rounded-lg bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Generating your starter kit…" : "✨ Generate starter kit"}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Tip: you can always come back and run this again, or edit the quest/event pages manually.
      </p>
    </div>
  );
}
