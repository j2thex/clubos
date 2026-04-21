"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { lockClubFromOwner } from "@/app/[clubSlug]/admin/actions";
import { lockClubFromStaff } from "@/app/[clubSlug]/staff/actions";

export type PanicActor = "owner" | "staff";

export function PanicIconButton({
  clubId,
  clubSlug,
  actor,
}: {
  clubId: string;
  clubSlug: string;
  actor: PanicActor;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmMsg = actor === "staff" ? t("panic.staffConfirmLock") : t("panic.confirmLock");
    if (!window.confirm(confirmMsg)) return;
    startTransition(async () => {
      const r = actor === "staff"
        ? await lockClubFromStaff(clubId, clubSlug)
        : await lockClubFromOwner(clubId, clubSlug);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      // Lock succeeded. Cookie was cleared server-side. Redirect the locker
      // off the domain entirely; they no longer have a way back in.
      window.location.href = r.redirect;
    });
  }

  const title = actor === "staff" ? t("panic.staffLock") : t("panic.lock");

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title={title}
      aria-label={title}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-red-500 bg-red-600 text-white shadow-lg transition-colors hover:bg-red-700 disabled:opacity-60"
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 11V7a4 4 0 118 0m-9 4h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2z"
          />
        </svg>
      )}
    </button>
  );
}
