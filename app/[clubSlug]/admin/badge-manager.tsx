"use client";

import { useState, useTransition } from "react";
import { addBadge, updateBadge, deleteBadge } from "./actions";
import { IconPicker } from "@/components/icon-picker";
import { DynamicIcon } from "@/components/dynamic-icon";

interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  earnedCount: number;
}

const TEMPLATES = [
  { name: "First Visit", description: "Awarded on your first check-in", icon: "star", color: "#eab308" },
  { name: "Social Butterfly", description: "Follow all our social accounts", icon: "share-2", color: "#3b82f6" },
  { name: "VIP Member", description: "Reach VIP status", icon: "crown", color: "#a855f7" },
  { name: "Event Regular", description: "Attend 5 events", icon: "calendar", color: "#ef4444" },
  { name: "Top Referrer", description: "Refer 3 or more friends", icon: "user-plus", color: "#10b981" },
];

export function BadgeManager({
  badges,
  clubId,
  clubSlug,
}: {
  badges: Badge[];
  clubId: string;
  clubSlug: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editIcon, setEditIcon] = useState<string | null>(null);
  const [editColor, setEditColor] = useState("#6b7280");

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newIcon, setNewIcon] = useState<string | null>(null);
  const [newColor, setNewColor] = useState("#6b7280");

  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyTemplate(t: typeof TEMPLATES[number]) {
    setNewName(t.name);
    setNewDesc(t.description);
    setNewIcon(t.icon);
    setNewColor(t.color);
  }

  function startEdit(b: Badge) {
    setEditingId(b.id);
    setEditName(b.name);
    setEditDesc(b.description ?? "");
    setEditIcon(b.icon);
    setEditColor(b.color);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function handleSaveEdit(badgeId: string) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", editName);
      fd.set("description", editDesc);
      fd.set("color", editColor);
      if (editIcon) fd.set("icon", editIcon);

      const result = await updateBadge(badgeId, fd, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleDelete(badgeId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteBadge(badgeId, clubSlug);
      if ("error" in result) setError(result.error);
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", newName);
      fd.set("description", newDesc);
      fd.set("color", newColor);
      if (newIcon) fd.set("icon", newIcon);

      const result = await addBadge(clubId, fd, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        const createdName = newName;
        setNewName("");
        setNewDesc("");
        setNewIcon(null);
        setNewColor("#6b7280");
        setSuccessMsg(`"${createdName}" created successfully`);
        setShowForm(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Badges ({badges.length})
        </h2>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {successMsg && (
          <div className="px-5 py-2.5 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-700">{successMsg}</span>
          </div>
        )}

        <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Active Badges ({badges.length})
          </p>
        </div>

        {/* Badge list */}
        {badges.length > 0 && (
          <div className="divide-y divide-gray-100">
            {badges.map((b) => (
              <div key={b.id}>
                {editingId === b.id ? (
                  <div className="px-5 py-3 space-y-3 bg-gray-50">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
                      />
                    </div>
                    <IconPicker value={editIcon} onChange={setEditIcon} />
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(b.id)}
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
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: b.color + "20", color: b.color }}
                    >
                      {b.icon ? (
                        <DynamicIcon name={b.icon} className="w-5 h-5" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                      {b.description && (
                        <p className="text-xs text-gray-400 truncate">{b.description}</p>
                      )}
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {b.earnedCount} earned
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(b)}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
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

        {/* Toggle button */}
        <button
          onClick={() => { setShowForm(!showForm); setSuccessMsg(null); }}
          className="w-full px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>{showForm ? "Cancel" : "Add New Badge"}</span>
          <svg className={`w-4 h-4 transition-transform ${showForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Add new badge */}
        {showForm && (
          <div>
            {/* Templates */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Quick Add</p>
              <div className="flex flex-wrap gap-2">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAdd} className="px-5 py-4 border-t border-gray-100 space-y-3 bg-gray-50">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Badge name"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="How to earn this badge"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
                />
              </div>
              <IconPicker value={newIcon} onChange={setNewIcon} />
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-24 rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 font-mono"
                  />
                  {/* Preview */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: newColor + "20", color: newColor }}
                  >
                    {newIcon ? <DynamicIcon name={newIcon} className="w-4 h-4" /> : <span className="text-xs font-bold">?</span>}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending || !newName.trim()}
                className="w-full rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Badge
              </button>
            </form>
          </div>
        )}

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
