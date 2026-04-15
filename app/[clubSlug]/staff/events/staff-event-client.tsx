"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { checkinMember, checkinMemberById, getEventRsvps } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

interface Event {
  id: string;
  title: string;
  date: string;
  reward_spins: number;
}

interface Rsvp {
  member_id: string;
  member_code: string;
  full_name: string;
  rsvp_date: string;
  checked_in: boolean;
}

export function StaffEventClient({
  events,
  clubId,
  clubSlug,
  staffMemberId,
}: {
  events: Event[];
  clubId: string;
  clubSlug: string;
  staffMemberId: string;
}) {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? "");
  const [memberCode, setMemberCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [successMemberCode, setSuccessMemberCode] = useState<string | null>(null);

  const [rsvps, setRsvps] = useState<Rsvp[]>([]);

  const loadRsvps = useCallback(
    (eventId: string) => {
      startTransition(async () => {
        const res = await getEventRsvps(eventId, clubId);
        if (!("error" in res)) {
          setRsvps(res.rsvps);
        }
      });
    },
    [clubId, startTransition],
  );

  // Auto-load RSVPs when event changes
  useEffect(() => {
    if (selectedEventId) {
      loadRsvps(selectedEventId);
    }
  }, [selectedEventId, loadRsvps]);

  function handleManualCheckin(e: React.FormEvent) {
    e.preventDefault();
    const code = memberCode.trim().toUpperCase();
    if (!code || !selectedEventId) return;

    setError(null);
    setSuccess(null);
    setSuccessMemberCode(null);
    startTransition(async () => {
      const res = await checkinMember(code, selectedEventId, clubId, staffMemberId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const event = events.find((ev) => ev.id === selectedEventId);
      setSuccess(
        t("staff.checkedInSuccess", { spins: event?.reward_spins ?? 0 }),
      );
      setSuccessMemberCode(code);
      setMemberCode("");
      loadRsvps(selectedEventId);
    });
  }

  function handleRsvpCheckin(memberId: string) {
    setError(null);
    setSuccess(null);
    setSuccessMemberCode(null);
    startTransition(async () => {
      const res = await checkinMemberById(memberId, selectedEventId, staffMemberId);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      const event = events.find((ev) => ev.id === selectedEventId);
      const rsvp = rsvps.find((r) => r.member_id === memberId);
      setSuccess(
        t("staff.checkedInSuccess", { spins: event?.reward_spins ?? 0 }),
      );
      setSuccessMemberCode(rsvp?.member_code ?? null);
      // Update locally for instant feedback
      setRsvps((prev) =>
        prev.map((r) => (r.member_id === memberId ? { ...r, checked_in: true } : r)),
      );
    });
  }

  function handleSelectEvent(eventId: string) {
    setSelectedEventId(eventId);
    setError(null);
    setSuccess(null);
    setRsvps([]);
  }

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const notCheckedIn = rsvps.filter((r) => !r.checked_in);
  const checkedIn = rsvps.filter((r) => r.checked_in);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t("staff.eventCheckIn")}
        </h3>
      </div>

      {/* Event selector */}
      <div className="px-5 py-3 border-b border-gray-100">
        <label className="block text-xs font-medium text-gray-500 mb-1">{t("staff.eventLabel")}</label>
        <select
          value={selectedEventId}
          onChange={(e) => handleSelectEvent(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-white"
        >
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} — {formatDate(ev.date)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="px-5 py-2 text-xs text-green-700 bg-green-50 border-t border-green-100">
          <span>{success}</span>
        </div>
      )}

      {/* RSVPs — not checked in */}
      {notCheckedIn.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="px-5 py-2 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("staff.rsvps", { count: notCheckedIn.length })}
            </p>
          </div>
          <div className="divide-y divide-gray-100">
            {notCheckedIn.map((r) => (
              <div key={r.member_id} className="px-5 py-2.5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-mono text-xs text-gray-500">{r.member_code}</span>
                    {r.full_name && <span className="ml-1.5">{r.full_name}</span>}
                  </p>
                </div>
                <button
                  onClick={() => handleRsvpCheckin(r.member_id)}
                  disabled={isPending}
                  className="rounded-lg bg-green-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {t("staff.checkIn")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Already checked in */}
      {checkedIn.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="px-5 py-2 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("staff.checkedInCount", { count: checkedIn.length })}
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {checkedIn.map((r) => (
              <div key={r.member_id} className="px-5 py-2 flex items-center justify-between opacity-60">
                <div className="min-w-0">
                  <p className="text-sm text-gray-700">
                    <span className="font-mono text-xs text-gray-400">{r.member_code}</span>
                    {r.full_name && <span className="ml-1.5">{r.full_name}</span>}
                  </p>
                </div>
                <span className="text-xs text-green-600 font-medium shrink-0 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  {t("common.done")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual check-in for walk-ins */}
      <form onSubmit={handleManualCheckin} className="px-5 py-4 border-t border-gray-100 flex gap-3 items-end">
        <div className="flex-1">
          <label htmlFor="eventMemberCode" className="block text-xs font-medium text-gray-500 mb-1">
            {t("staff.walkinCheckIn")}
          </label>
          <input
            id="eventMemberCode"
            type="text"
            value={memberCode}
            onChange={(e) => setMemberCode(e.target.value.toUpperCase())}
            placeholder={t("staff.memberCodePlaceholder")}
            maxLength={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono tracking-wide uppercase text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition text-center"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !memberCode.trim() || !selectedEventId}
          className="rounded-lg bg-gray-800 text-white px-6 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {isPending ? "..." : t("staff.checkIn")}
        </button>
      </form>
    </div>
  );
}
