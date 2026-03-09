"use client";

import { useState, useTransition } from "react";
import { checkinMember } from "./actions";

interface Event {
  id: string;
  title: string;
  date: string;
  reward_spins: number;
}

export function StaffEventClient({
  events,
  clubId,
  staffMemberId,
}: {
  events: Event[];
  clubId: string;
  staffMemberId: string;
}) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [memberCode, setMemberCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleCheckin(e: React.FormEvent) {
    e.preventDefault();
    const code = memberCode.trim().toUpperCase();
    if (!code || !selectedEventId) return;

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await checkinMember(code, selectedEventId, clubId, staffMemberId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const event = events.find((ev) => ev.id === selectedEventId);
      setSuccess(
        `Checked in! +${event?.reward_spins ?? 0} spin${(event?.reward_spins ?? 0) === 1 ? "" : "s"} awarded (balance: ${res.newBalance})`,
      );
      setMemberCode("");
    });
  }

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Event Check-In
        </h3>
      </div>

      {/* Event selector */}
      <div className="px-5 py-3 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-500 mb-1">Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => {
            setSelectedEventId(e.target.value);
            setError(null);
            setSuccess(null);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-white"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} — {formatDate(ev.date)}
            </option>
          ))}
        </select>
      </div>

      {/* Member code input */}
      <form onSubmit={handleCheckin} className="px-5 py-4 flex gap-3 items-end">
        <div className="flex-1">
          <label htmlFor="eventMemberCode" className="block text-xs font-medium text-gray-500 mb-1">
            Member Code
          </label>
          <input
            id="eventMemberCode"
            type="text"
            value={memberCode}
            onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
            placeholder="ABC12"
            maxLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition text-center"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !memberCode.trim() || !selectedEventId}
          className="rounded-lg bg-gray-800 text-white px-6 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {isPending ? "..." : "Check In"}
        </button>
      </form>

      {error && (
        <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="px-5 py-2 text-xs text-green-700 bg-green-50 border-t border-green-100">
          {success}
        </div>
      )}
    </div>
  );
}
