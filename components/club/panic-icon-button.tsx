"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { lockClubFromOwner, unlockClub } from "@/app/[clubSlug]/admin/actions";
import { lockClubFromStaff } from "@/app/[clubSlug]/staff/actions";

export type PanicActor = "owner" | "staff";

export function PanicIconButton({
  clubId,
  clubSlug,
  locked,
  actor,
}: {
  clubId: string;
  clubSlug: string;
  locked: boolean;
  actor: PanicActor;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const canUnlock = actor === "owner";

  function handleClick() {
    if (locked) {
      if (!canUnlock) return;
      if (!window.confirm(t("panic.confirmUnlock"))) return;
      startTransition(async () => {
        const r = await unlockClub(clubId, clubSlug);
        if ("error" in r) toast.error(r.error);
        else toast.success(t("panic.unlocked"));
      });
      return;
    }

    const confirmMsg = actor === "staff" ? t("panic.staffConfirmLock") : t("panic.confirmLock");
    if (!window.confirm(confirmMsg)) return;
    startTransition(async () => {
      const r = actor === "staff"
        ? await lockClubFromStaff(clubId, clubSlug)
        : await lockClubFromOwner(clubId, clubSlug);
      if ("error" in r) toast.error(r.error);
      else toast.success(t("panic.locked"));
    });
  }

  const title = locked
    ? (canUnlock ? t("panic.unlock") : t("panic.staffLockedBanner"))
    : (actor === "staff" ? t("panic.staffLock") : t("panic.lock"));

  const disabled = isPending || (locked && !canUnlock);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full border text-white shadow-lg transition-colors disabled:opacity-60 ${
        locked
          ? "bg-red-700 border-red-400 ring-2 ring-red-300/60 animate-pulse"
          : "bg-red-600 border-red-500 hover:bg-red-700"
      }`}
    >
      {isPending ? (
        <span className="text-xs">…</span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          {locked ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 11V7a7 7 0 1114 0v4m-12 0h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 11V7a4 4 0 118 0m-9 4h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2z"
            />
          )}
        </svg>
      )}
    </button>
  );
}
