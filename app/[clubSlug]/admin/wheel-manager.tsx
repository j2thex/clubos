"use client";

import { useState, useTransition } from "react";
import { addSegment, updateSegment, deleteSegment, toggleSpinEnabled } from "./actions";

interface Segment {
  id: string;
  label: string;
  label_es: string | null;
  color: string;
  label_color: string;
  probability: number;
  display_order: number;
}

export function WheelManager({
  segments,
  clubId,
  clubSlug,
  spinEnabled,
}: {
  segments: Segment[];
  clubId: string;
  clubSlug: string;
  spinEnabled: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editLabelEs, setEditLabelEs] = useState("");
  const [editColor, setEditColor] = useState("#16a34a");
  const [editLabelColor, setEditLabelColor] = useState("#ffffff");
  const [editProb, setEditProb] = useState("10");

  const [newLabel, setNewLabel] = useState("");
  const [newLabelEs, setNewLabelEs] = useState("");
  const [newColor, setNewColor] = useState("#16a34a");
  const [newLabelColor, setNewLabelColor] = useState("#ffffff");
  const [newProb, setNewProb] = useState("10");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit(seg: Segment) {
    setEditingId(seg.id);
    setEditLabel(seg.label);
    setEditLabelEs(seg.label_es ?? "");
    setEditColor(seg.color);
    setEditLabelColor(seg.label_color);
    setEditProb(String(Math.round(seg.probability * 100)));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function handleSaveEdit(segId: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateSegment(
        segId,
        editLabel,
        editColor,
        editLabelColor,
        Number(editProb) / 100,
        clubSlug,
        editLabelEs,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleDelete(segId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteSegment(segId, clubSlug);
      if (result.error) setError(result.error);
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addSegment(
        clubId,
        newLabel,
        newColor,
        newLabelColor,
        Number(newProb) / 100,
        clubSlug,
        newLabelEs,
      );
      if (result.error) {
        setError(result.error);
      } else {
        setNewLabel("");
        setNewLabelEs("");
        setNewColor("#16a34a");
        setNewLabelColor("#ffffff");
        setNewProb("10");
      }
    });
  }

  const totalProb = segments.reduce((sum, s) => sum + s.probability, 0);
  const totalPercent = Math.round(totalProb * 100);

  function handleToggleSpinEnabled() {
    startTransition(async () => {
      const result = await toggleSpinEnabled(clubId, !spinEnabled, clubSlug);
      if ("error" in result) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      {/* Spin enabled toggle */}
      <div className="bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Spin Wheel Enabled</p>
          <p className="text-xs text-gray-400">
            {spinEnabled ? "Members can access the spin wheel" : "Spin wheel is hidden from members"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={spinEnabled}
          onClick={handleToggleSpinEnabled}
          disabled={isPending}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:opacity-50 ${
            spinEnabled ? "bg-green-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              spinEnabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Wheel Segments ({segments.length})
        </h2>
        <span className={`text-xs font-medium ${totalPercent === 100 ? "text-green-600" : "text-amber-600"}`}>
          Total: {totalPercent}%
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Segment list */}
        {segments.length > 0 && (
          <div className="divide-y divide-gray-100">
            {segments.map((seg) => (
              <div key={seg.id}>
                {editingId === seg.id ? (
                  <div className="px-5 py-3 space-y-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Label (EN)</label>
                        <input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Label (ES)</label>
                        <input
                          type="text"
                          value={editLabelEs}
                          onChange={(e) => setEditLabelEs(e.target.value)}
                          placeholder="Spanish"
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Prob %</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={editProb}
                          onChange={(e) => setEditProb(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Background</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="h-8 w-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <span className="text-xs font-mono text-gray-500">{editColor}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Text Color</label>
                        <div className="flex gap-2 items-center">
                          <input
                            type="color"
                            value={editLabelColor}
                            onChange={(e) => setEditLabelColor(e.target.value)}
                            className="h-8 w-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <span className="text-xs font-mono text-gray-500">{editLabelColor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(seg.id)}
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
                      className="w-8 h-8 rounded-lg shrink-0 border border-gray-200"
                      style={{ backgroundColor: seg.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{seg.label}</p>
                      <p className="text-xs text-gray-400">{Math.round(seg.probability * 100)}%</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(seg)}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(seg.id)}
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

        {/* Add new segment */}
        <form onSubmit={handleAdd} className="px-5 py-4 border-t border-gray-100 space-y-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Add Segment</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Label (EN)</label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Free Drink"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Label (ES)</label>
              <input
                type="text"
                value={newLabelEs}
                onChange={(e) => setNewLabelEs(e.target.value)}
                placeholder="Bebida Gratis"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">%</label>
              <input
                type="number"
                min="1"
                max="100"
                value={newProb}
                onChange={(e) => setNewProb(e.target.value)}
                required
                className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-[34px] w-10 rounded border border-gray-300 cursor-pointer"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !newLabel.trim()}
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
