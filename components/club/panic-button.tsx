"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { lockClub, unlockClub } from "@/app/[clubSlug]/lockdown-actions";

export function PanicButton({
  clubSlug,
  locked,
  variant = "default",
}: {
  clubSlug: string;
  locked: boolean;
  variant?: "default" | "compact";
}) {
  const [isPending, startTransition] = useTransition();
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");

  function doLock() {
    if (
      !window.confirm(
        "Lock the club? Members will lose access until you or an admin unlocks. Staff and admin keep access.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      const res = await lockClub(clubSlug, reason);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Club locked — members blocked");
        setReason("");
        setShowReason(false);
      }
    });
  }

  function doUnlock() {
    startTransition(async () => {
      const res = await unlockClub(clubSlug);
      if ("error" in res) toast.error(res.error);
      else toast.success("Club unlocked");
    });
  }

  if (locked) {
    return (
      <button
        type="button"
        onClick={doUnlock}
        disabled={isPending}
        className={
          variant === "compact"
            ? "rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50 transition-colors"
            : "w-full rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold py-4 disabled:opacity-50 transition-colors"
        }
      >
        {isPending ? "Unlocking..." : "🔓 UNLOCK CLUB"}
      </button>
    );
  }

  return (
    <div className={variant === "compact" ? "" : "space-y-2"}>
      {variant !== "compact" && showReason && (
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional, for activity log)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      )}
      <button
        type="button"
        onClick={doLock}
        disabled={isPending}
        onFocus={() => variant !== "compact" && setShowReason(true)}
        className={
          variant === "compact"
            ? "rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 disabled:opacity-50 transition-colors"
            : "w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold py-4 disabled:opacity-50 transition-colors shadow-lg"
        }
      >
        {isPending ? "Locking..." : variant === "compact" ? "🔒 Panic" : "🔒 PANIC — LOCK CLUB"}
      </button>
    </div>
  );
}
