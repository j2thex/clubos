"use client";

import { useState, useTransition } from "react";
import { addEvent, updateEvent, deleteEvent } from "./actions";
import { IconPicker } from "@/components/icon-picker";
import { DynamicIcon } from "@/components/dynamic-icon";
import { LanguageTabs } from "@/components/language-tabs";
import { useLanguage } from "@/lib/i18n/provider";

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
  end_time: string | null;
  price: number | null;
  title_es: string | null;
  description_es: string | null;
  image_url: string | null;
  icon: string | null;
  link: string | null;
  reward_spins: number;
  rsvps: number;
  checkins: number;
  is_public: boolean;
  recurrence_rule: string | null;
  recurrence_parent_id: string | null;
  recurrence_end_date: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
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
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editReward, setEditReward] = useState("0");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editIcon, setEditIcon] = useState<string | null>(null);
  const [editLang, setEditLang] = useState<"en" | "es">("en");
  const [editTitleEs, setEditTitleEs] = useState("");
  const [editDescEs, setEditDescEs] = useState("");
  const [editLocationName, setEditLocationName] = useState("");
  const [editLat, setEditLat] = useState<number | null>(null);
  const [editLng, setEditLng] = useState<number | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newReward, setNewReward] = useState("0");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newIcon, setNewIcon] = useState<string | null>(null);
  const [newLang, setNewLang] = useState<"en" | "es">("en");
  const [newTitleEs, setNewTitleEs] = useState("");
  const [newDescEs, setNewDescEs] = useState("");
  const [newRecurrence, setNewRecurrence] = useState<string>("");
  const [newRecurrenceEnd, setNewRecurrenceEnd] = useState<string>("");
  const [newLocationName, setNewLocationName] = useState("");
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);

  const [scopePrompt, setScopePrompt] = useState<{ type: "edit" | "delete"; eventId: string } | null>(null);
  const [editScope, setEditScope] = useState<string>("single");

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
    setEditEndTime(ev.end_time ?? "");
    setEditPrice(ev.price != null ? String(ev.price) : "");
    setEditLink(ev.link ?? "");
    setEditReward(String(ev.reward_spins));
    setEditIsPublic(ev.is_public);
    setEditIcon(ev.icon);
    setEditTitleEs(ev.title_es ?? "");
    setEditDescEs(ev.description_es ?? "");
    setEditLocationName(ev.location_name ?? "");
    setEditLat(ev.latitude);
    setEditLng(ev.longitude);
    setEditLang("en");
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
      fd.set("end_time", editEndTime);
      fd.set("price", editPrice);
      fd.set("link", editLink);
      fd.set("reward_spins", editReward);
      fd.set("is_public", editIsPublic ? "1" : "0");
      if (editIcon) fd.set("icon", editIcon);
      fd.set("title_es", editTitleEs);
      fd.set("description_es", editDescEs);
      if (editImage) fd.set("image", editImage);
      fd.set("location_name", editLocationName);
      if (editLat != null) fd.set("latitude", String(editLat));
      if (editLng != null) fd.set("longitude", String(editLng));
      fd.set("scope", editScope);

      const result = await updateEvent(eventId, fd, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        setEditingId(null);
        setEditScope("single");
      }
    });
  }

  function handleRemove(eventId: string, scope: string = "single") {
    setError(null);
    startTransition(async () => {
      const result = await deleteEvent(eventId, clubSlug, scope);
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
      fd.set("end_time", newEndTime);
      fd.set("price", newPrice);
      fd.set("link", newLink);
      fd.set("reward_spins", newReward);
      fd.set("is_public", newIsPublic ? "1" : "0");
      if (newIcon) fd.set("icon", newIcon);
      fd.set("title_es", newTitleEs);
      fd.set("description_es", newDescEs);
      if (newImage) fd.set("image", newImage);
      fd.set("location_name", newLocationName);
      if (newLat != null) fd.set("latitude", String(newLat));
      if (newLng != null) fd.set("longitude", String(newLng));
      if (newRecurrence) fd.set("recurrence_rule", newRecurrence);
      if (newRecurrenceEnd) fd.set("recurrence_end_date", newRecurrenceEnd);

      const result = await addEvent(clubId, fd, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        const createdTitle = newTitle;
        const createdCount = "count" in result ? result.count : undefined;
        setNewTitle("");
        setNewDesc("");
        setNewDate("");
        setNewTime("");
        setNewEndTime("");
        setNewPrice("");
        setNewLink("");
        setNewReward("1");
        setNewIsPublic(false);
        setNewIcon(null);
        setNewImage(null);
        setNewTitleEs("");
        setNewDescEs("");
        setNewLang("en");
        setNewRecurrence("");
        setNewRecurrenceEnd("");
        setNewLocationName("");
        setNewLat(null);
        setNewLng(null);
        const msg = createdCount && createdCount > 1
          ? t("events.occurrencesCreated", { count: String(createdCount) })
          : `"${createdTitle}" created successfully`;
        setSuccessMsg(msg);
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
                    <LanguageTabs value={editLang} onChange={setEditLang} />
                    {editLang === "en" ? (
                      <>
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
                          <textarea
                            rows={3}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Title (ES)</label>
                          <input
                            type="text"
                            value={editTitleEs}
                            onChange={(e) => setEditTitleEs(e.target.value)}
                            placeholder={editTitle || "Title"}
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Description (ES)</label>
                          <textarea
                            rows={3}
                            value={editDescEs}
                            onChange={(e) => setEditDescEs(e.target.value)}
                            placeholder={editDesc || "Description"}
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
                          />
                        </div>
                      </>
                    )}
                    <IconPicker value={editIcon} onChange={setEditIcon} />
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
                        <label className="block text-xs font-medium text-gray-500 mb-1">Start time (optional)</label>
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">End time (optional)</label>
                        <input
                          type="time"
                          value={editEndTime}
                          onChange={(e) => setEditEndTime(e.target.value)}
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
                          step="0.1"
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
                      <label className="block text-xs font-medium text-gray-500 mb-1">Location (optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editLocationName}
                          onChange={(e) => setEditLocationName(e.target.value)}
                          placeholder="Venue name or address"
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!editLocationName.trim()) return;
                            const { findCoordinates } = await import("./location-actions");
                            const result = await findCoordinates(editLocationName);
                            if ("error" in result) {
                              setError(result.error);
                            } else {
                              setEditLat(result.lat);
                              setEditLng(result.lng);
                            }
                          }}
                          disabled={!editLocationName.trim()}
                          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors shrink-0"
                        >
                          📍
                        </button>
                      </div>
                      {editLat != null && editLng != null && (
                        <p className="text-[10px] text-green-600 mt-1">✓ {editLat.toFixed(4)}, {editLng.toFixed(4)}</p>
                      )}
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
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsPublic}
                        onChange={(e) => setEditIsPublic(e.target.checked)}
                        className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                      />
                      <span className="text-xs text-gray-600">Show on public profile</span>
                    </label>
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
                    {ev.icon && !ev.image_url && (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <DynamicIcon name={ev.icon} className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    {ev.image_url && (
                      <img
                        src={ev.image_url}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                        {ev.is_public && (
                          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">Public</span>
                        )}
                        {(ev.recurrence_rule || ev.recurrence_parent_id) && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                            {t("events.recurring")}
                          </span>
                        )}
                      </div>
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
                        onClick={() => {
                          if (ev.recurrence_rule || ev.recurrence_parent_id) {
                            setScopePrompt({ type: "edit", eventId: ev.id });
                          } else {
                            startEdit(ev);
                          }
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (ev.recurrence_rule || ev.recurrence_parent_id) {
                            setScopePrompt({ type: "delete", eventId: ev.id });
                          } else {
                            handleRemove(ev.id);
                          }
                        }}
                        disabled={isPending}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
                {/* Scope prompt for recurring events */}
                {scopePrompt?.eventId === ev.id && (
                  <div className="ml-11 mt-2 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-500 mr-2">
                      {scopePrompt.type === "edit" ? t("events.editScope") : t("events.deleteScope")}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (scopePrompt.type === "edit") {
                          setEditScope("single");
                          startEdit(ev);
                        } else {
                          handleRemove(ev.id, "single");
                        }
                        setScopePrompt(null);
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {t("events.thisOnly")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (scopePrompt.type === "edit") {
                          setEditScope("future");
                          startEdit(ev);
                        } else {
                          handleRemove(ev.id, "future");
                        }
                        setScopePrompt(null);
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {t("events.allFuture")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setScopePrompt(null)}
                      className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                    >
                      ✕
                    </button>
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
          <LanguageTabs value={newLang} onChange={setNewLang} />
          {newLang === "en" ? (
            <>
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
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Join us for an evening of fun"
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Title (ES)</label>
                <input
                  type="text"
                  value={newTitleEs}
                  onChange={(e) => setNewTitleEs(e.target.value)}
                  placeholder={newTitle || "Friday Night Social"}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Description (ES)</label>
                <textarea
                  rows={3}
                  value={newDescEs}
                  onChange={(e) => setNewDescEs(e.target.value)}
                  placeholder={newDesc || "Join us for an evening of fun"}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
                />
              </div>
            </>
          )}
          <IconPicker value={newIcon} onChange={setNewIcon} />
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Start time (optional)</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">End time (optional)</label>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
          </div>
          {/* Repeat */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{t("events.repeat")}</label>
            <select
              value={newRecurrence}
              onChange={(e) => setNewRecurrence(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            >
              <option value="">{t("events.noRepeat")}</option>
              <option value="daily">{t("events.daily")}</option>
              <option value="weekly">{t("events.weekly")}</option>
              <option value="biweekly">{t("events.biweekly")}</option>
              <option value="monthly">{t("events.monthly")}</option>
            </select>
            {newRecurrence && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-500 shrink-0">{t("events.until")}</label>
                <input
                  type="date"
                  name="recurrence_end_date"
                  value={newRecurrenceEnd}
                  onChange={(e) => setNewRecurrenceEnd(e.target.value)}
                  required
                  min={newDate}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
            )}
            {newRecurrence && newRecurrenceEnd && newDate && (
              <p className="text-xs text-gray-400">
                {(() => {
                  const start = new Date(newDate + "T00:00:00");
                  const end = new Date(newRecurrenceEnd + "T00:00:00");
                  let count = 0;
                  let cur = new Date(start);
                  while (count < 52) {
                    if (newRecurrence === "daily") cur.setDate(cur.getDate() + 1);
                    else if (newRecurrence === "weekly") cur.setDate(cur.getDate() + 7);
                    else if (newRecurrence === "biweekly") cur.setDate(cur.getDate() + 14);
                    else if (newRecurrence === "monthly") {
                      const day = start.getDate();
                      cur.setMonth(cur.getMonth() + 1);
                      const last = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
                      cur.setDate(Math.min(day, last));
                    }
                    if (cur > end) break;
                    count++;
                  }
                  return t("events.occurrencesCreated", { count: String(count + 1) });
                })()}
              </p>
            )}
          </div>
          {newRecurrence && <input type="hidden" name="recurrence_rule" value={newRecurrence} />}
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
                step="0.1"
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Location (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                placeholder="Venue name or address"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newLocationName.trim()) return;
                  const { findCoordinates } = await import("./location-actions");
                  const result = await findCoordinates(newLocationName);
                  if ("error" in result) {
                    setError(result.error);
                  } else {
                    setNewLat(result.lat);
                    setNewLng(result.lng);
                  }
                }}
                disabled={!newLocationName.trim()}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors shrink-0"
              >
                📍
              </button>
            </div>
            {newLat != null && newLng != null && (
              <p className="text-[10px] text-green-600 mt-1">✓ {newLat.toFixed(4)}, {newLng.toFixed(4)}</p>
            )}
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
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newIsPublic}
              onChange={(e) => setNewIsPublic(e.target.checked)}
              className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <span className="text-xs text-gray-600">Show on public profile</span>
          </label>
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
