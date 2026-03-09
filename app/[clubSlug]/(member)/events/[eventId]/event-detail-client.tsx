"use client";

import { useState, useTransition } from "react";
import { rsvpEvent, cancelRsvp } from "../actions";

export function EventDetailClient({
  eventId,
  memberId,
  hasRsvp: initialHasRsvp,
}: {
  eventId: string;
  memberId: string;
  hasRsvp: boolean;
}) {
  const [hasRsvp, setHasRsvp] = useState(initialHasRsvp);
  const [isPending, startTransition] = useTransition();

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
