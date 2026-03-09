"use client";

import { useState, useTransition } from "react";
import { addQuest, updateQuest, deleteQuest } from "./actions";

interface Quest {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  reward_spins: number;
  display_order: number;
  completions: number;
}

const TEMPLATES = [
  { title: "Follow us on Instagram", description: "Follow our Instagram page", link: "", rewardSpins: 1 },
  { title: "Follow us on TikTok", description: "Follow our TikTok account", link: "", rewardSpins: 1 },
  { title: "Leave a Google Review", description: "Leave us a review on Google Maps", link: "", rewardSpins: 2 },
  { title: "Refer a Friend", description: "Bring a friend to the club", link: "", rewardSpins: 2 },
];

export function QuestManager({
  quests,
  clubId,
  clubSlug,
}: {
  quests: Quest[];
  clubId: string;
  clubSlug: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editReward, setEditReward] = useState("1");

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newReward, setNewReward] = useState("1");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyTemplate(t: typeof TEMPLATES[number]) {
    setNewTitle(t.title);
    setNewDesc(t.description);
    setNewLink(t.link);
    setNewReward(String(t.rewardSpins));
  }

  function startEdit(q: Quest) {
    setEditingId(q.id);
    setEditTitle(q.title);
    setEditDesc(q.description ?? "");
    setEditLink(q.link ?? "");
    setEditReward(String(q.reward_spins));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function handleSaveEdit(questId: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateQuest(questId, editTitle, editDesc, editLink, Number(editReward), clubSlug);
      if (result.error) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleDelete(questId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteQuest(questId, clubSlug);
      if (result.error) setError(result.error);
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addQuest(clubId, newTitle, newDesc, newLink, Number(newReward), clubSlug);
      if (result.error) {
        setError(result.error);
      } else {
        setNewTitle("");
        setNewDesc("");
        setNewLink("");
        setNewReward("1");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Quests ({quests.length})
        </h2>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Templates */}
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Quick Add</p>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={() => applyTemplate(t)}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Quest list */}
        {quests.length > 0 && (
          <div className="divide-y divide-gray-100">
            {quests.map((q) => (
              <div key={q.id}>
                {editingId === q.id ? (
                  <div className="px-5 py-3 space-y-3 bg-gray-50">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                      />
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Link (optional)</label>
                        <input
                          type="url"
                          value={editLink}
                          onChange={(e) => setEditLink(e.target.value)}
                          placeholder="https://..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Spins</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editReward}
                          onChange={(e) => setEditReward(e.target.value)}
                          className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(q.id)}
                        disabled={isPending}
                        className="rounded-lg bg-gray-800 text-white px-4 py-1.5 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{q.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {q.reward_spins} {q.reward_spins === 1 ? "spin" : "spins"}
                        </span>
                        {q.link && (
                          <span className="text-xs text-blue-500 truncate max-w-[150px]">{q.link}</span>
                        )}
                        <span className="text-xs text-gray-300">
                          {q.completions} done
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(q)}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        disabled={isPending}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add new quest */}
        <form onSubmit={handleAdd} className="px-5 py-4 border-t border-gray-100 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add Quest</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Follow us on Instagram"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Follow our Instagram page"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Link (optional)</label>
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://instagram.com/yourclub"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Spins</label>
              <input
                type="number"
                min="1"
                max="100"
                value={newReward}
                onChange={(e) => setNewReward(e.target.value)}
                required
                className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !newTitle.trim()}
              className="rounded-lg bg-gray-800 text-white px-4 py-1.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </form>

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
