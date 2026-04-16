"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { voidTransaction } from "../sell/actions";

export function VoidButton({
  transactionId,
  clubSlug,
}: {
  transactionId: string;
  clubSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleVoid() {
    if (!reason.trim()) return;
    startTransition(async () => {
      const r = await voidTransaction(transactionId, clubSlug, reason);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success("Transaction voided; stock restored");
      setOpen(false);
      setReason("");
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-500 hover:text-red-600"
      >
        Void
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason"
        className="rounded-lg border border-gray-300 px-2 py-1 text-xs w-32"
        autoFocus
      />
      <button
        type="button"
        onClick={handleVoid}
        disabled={isPending || !reason.trim()}
        className="text-xs rounded-full bg-red-600 text-white px-3 py-1 font-semibold disabled:opacity-50"
      >
        {isPending ? "…" : "Void"}
      </button>
      <button
        type="button"
        onClick={() => {
          setOpen(false);
          setReason("");
        }}
        className="text-xs text-gray-500"
      >
        Cancel
      </button>
    </div>
  );
}
