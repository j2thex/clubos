"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { lockClubFromOwner, unlockClub } from "@/app/[clubSlug]/admin/actions";

interface PanicSwitchManagerProps {
  clubId: string;
  clubSlug: string;
  locked: boolean;
  lockedAt: string | null;
  lockedByType: "staff" | "owner" | "platform" | null;
  lockedByLabel: string | null;
}

export function PanicSwitchManager({
  clubId,
  clubSlug,
  locked,
  lockedAt,
  lockedByType,
  lockedByLabel,
}: PanicSwitchManagerProps) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function handleLock() {
    if (!window.confirm(t("panic.confirmLock"))) return;
    startTransition(async () => {
      const r = await lockClubFromOwner(clubId, clubSlug);
      if ("error" in r) toast.error(r.error);
      else toast.success(t("panic.locked"));
    });
  }

  function handleUnlock() {
    if (!window.confirm(t("panic.confirmUnlock"))) return;
    startTransition(async () => {
      const r = await unlockClub(clubId, clubSlug);
      if ("error" in r) toast.error(r.error);
      else toast.success(t("panic.unlocked"));
    });
  }

  const actorLabel =
    lockedByType === "staff"
      ? t("panic.byStaff", { code: lockedByLabel ?? "?" })
      : lockedByType === "owner"
        ? t("panic.byOwner", { email: lockedByLabel ?? "?" })
        : lockedByType === "platform"
          ? t("panic.byPlatform")
          : "";

  const sinceLabel = lockedAt
    ? new Date(lockedAt).toLocaleString(undefined, {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t("panic.title")}
      </h2>
      <div
        className={`rounded-2xl shadow-lg overflow-hidden ${locked ? "bg-red-50 border border-red-200" : "bg-white"}`}
      >
        <div className="p-5 space-y-3">
          <p className="text-sm text-gray-700">{t("panic.description")}</p>
          {locked ? (
            <>
              <div className="rounded-lg bg-red-100 text-red-900 p-3 text-sm">
                <p className="font-semibold">{t("panic.currentlyLocked")}</p>
                <p className="text-xs mt-1">
                  {actorLabel} · {sinceLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={handleUnlock}
                disabled={isPending}
                className="w-full rounded-full bg-gray-800 text-white text-sm font-semibold px-4 py-2 hover:bg-gray-700 disabled:opacity-50"
              >
                {isPending ? "…" : t("panic.unlock")}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleLock}
              disabled={isPending}
              className="w-full rounded-full bg-red-600 text-white text-sm font-semibold px-4 py-2 hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? "…" : t("panic.lock")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
