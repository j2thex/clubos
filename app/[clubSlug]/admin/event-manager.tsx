"use client";

import { useState, useTransition } from "react";
import { addEvent, updateEvent, deleteEvent } from "./actions";

const TEMPLATES = [
  { title: "Weekly Party", description: "Weekly club night", rewardSpins: 1 },
  { title: "DJ Night", description: "Live DJ set", rewardSpins: 1 },
  { title: "Members Only Event", description: "Exclusive members event", rewardSpins: 2 },
  { title: "Open Mic Night", description: "Open mic and live performances", rewardSpins: 1 },
];

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  price: number | null;
  image_url: string | null;
  link: string | null;
  reward_spins: number;
  rsvps: number;
  checkins: number;
}

export function EventManager({
  events,
  clubId,
  clubSlug,
}: {
  events: Event[];
  clubId: string;
  clubSlug: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editReward, setEditReward] = useState("1");
  const [editImage, setEditImage] = useState<File | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newReward, setNewReward] = useState("1");
  const [newImage, setNewImage] = useState<File | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyTemplate(t: typeof TEMPLATES[number]) {
    setNewTitle(t.title);
    setNewDesc(t.description);
    setNewReward(String(t.rewardSpins));
  }

  function startEdit(ev: Event) {
    setEditingId(ev.id);
    setEditTitle(ev.title);
    setEditDesc(ev.description ?? "");
    setEditDate(ev.date);
    setEditTime(ev.time ?? "");
    setEditPrice(ev.price != null ? String(ev.price) : "");
    setEditLink(ev.link ?? "");
    setEditReward(String(ev.reward_spins));
    setEditImage(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function handleSaveEdit(eventId: string) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", editTitle);
      fd.set("description", editDesc);
      fd.set("date", editDate);
      fd.set("time", editTime);
      fd.set("price", editPrice);
      fd.set("link", editLink);
      fd.set("reward_spins", editReward);
      if (editImage) fd.set("image", editImage);

      const result = await updateEvent(eventId, fd, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleDelete(eventId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteEvent(eventId, clubSlug);
      if ("error" in result) setError(result.error);
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", newTitle);
      fd.set("description", newDesc);
      fd.set("date", newDate);
      fd.set("time", newTime);
      fd.set("price", newPrice);
      fd.set("link", newLink);
      fd.set("reward_spins", newReward);
      if (newImage) fd.set("image", newImage);

      const result = await addEvent(clubId, fd, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        const createdTitle = newTitle;
        setNewTitle("");
        setNewDesc("");
        setNewDate("");
        setNewTime("");
        setNewPrice("");
        setNewLink("");
        setNewReward("1");
        setNewImage(null);
        setSuccessMsg(`"${createdTitle}" created successfully`);
        setShowForm(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    });
  }

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Events ({events.length})
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
            Active Events ({events.length})
          </p>
        </div>

        {/* Event list */}
        {events.length > 0 && (
          <div className="divide-y divide-gray-100">
            {events.map((ev) => (
              <div key={ev.id}>
                {editingId === ev.id ? (
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Time (optional)</label>
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_auto] gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Price (optional)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="Free"
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Spins</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editReward}
                          onChange={(e) => setEditReward(e.target.value)}
                          className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                    </div>
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
                      <label className="block text-xs font-medium text-gray-500 mb-1">Image (optional)</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => setEditImage(e.target.files?.[0] ?? null)}
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(ev.id)}
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
                    {ev.image_url && (
                      <img
                        src={ev.image_url}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-500">{formatDate(ev.date)}</span>
                        {ev.price != null && (
                          <span className="text-xs text-gray-400">${Number(ev.price).toFixed(2)}</span>
                        )}
                        {ev.price == null && (
                          <span className="text-xs text-green-600">Free</span>
                        )}
                        <span className="text-xs text-gray-300">
                          {ev.rsvps} RSVP{ev.rsvps !== 1 && "s"}
                        </span>
                        <span className="text-xs text-gray-300">
                          {ev.checkins} check-in{ev.checkins !== 1 && "s"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(ev)}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(ev.id)}
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
          <span>{showForm ? "Cancel" : "Add New Event"}</span>
          <svg className={`w-4 h-4 transition-transform ${showForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Add new event */}
        {showForm && (
        <div>
          {/* Templates */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
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
        <form onSubmit={handleAdd} className="px-5 py-4 border-t border-gray-100 space-y-3 bg-gray-50">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Friday Night Social"
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
              placeholder="Join us for an evening of fun"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Time (optional)</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price (optional, leave empty = free)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Spins</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newReward}
                onChange={(e) => setNewReward(e.target.value)}
                required
                className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Link (optional)</label>
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Image (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setNewImage(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>
          <button
            type="submit"
            disabled={isPending || !newTitle.trim() || !newDate}
            className="rounded-lg bg-gray-800 text-white px-4 py-1.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Event
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
