"use client";

import { useState, useTransition } from "react";
import { rsvpEvent, cancelRsvp } from "../actions";

export function EventDetailClient({
  eventId,
  memberId,
  hasRsvp: initialHasRsvp,
  checkedIn,
  eventDate,
}: {
  eventId: string;
  memberId: string;
  hasRsvp: boolean;
  checkedIn: boolean;
  eventDate: string;
}) {
  const [hasRsvp, setHasRsvp] = useState(initialHasRsvp);
  const [isPending, startTransition] = useTransition();

  // Client-side date check using browser timezone
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const isPast = eventDate < todayStr;

  if (isPast) {
    return (
      <p className="text-center text-sm text-gray-400 py-2">This event has passed</p>
    );
  }

  if (checkedIn) {
    return (
      <div className="w-full py-3 rounded-xl text-sm font-semibold text-center bg-green-100 text-green-700">
        Checked In
      </div>
    );
  }

  function handleToggle() {
    startTransition(async () => {
      if (hasRsvp) {
        const res = await cancelRsvp(eventId, memberId);
        if (!("error" in res)) setHasRsvp(false);
      } else {
        const res = await rsvpEvent(eventId, memberId);
        if (!("error" in res)) setHasRsvp(true);
      }
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
        hasRsvp
          ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
          : "club-primary-bg text-white hover:opacity-90"
      }`}
    >
      {hasRsvp ? "Cancel Sign Up" : "Sign Up"}
    </button>
  );
}
