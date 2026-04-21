"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { lockClubFromStaff } from "@/app/[clubSlug]/staff/actions";

export function StaffLockClubButton({
  clubId,
  clubSlug,
  locked,
}: {
  clubId: string;
  clubSlug: string;
  locked: boolean;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  if (locked) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
        <p className="font-semibold">{t("panic.staffLockedBanner")}</p>
        <p className="text-xs mt-1 text-red-800">{t("panic.staffLockedBannerHint")}</p>
      </div>
    );
  }

  function handleClick() {
    if (!window.confirm(t("panic.staffConfirmLock"))) return;
    startTransition(async () => {
      const r = await lockClubFromStaff(clubId, clubSlug);
      if ("error" in r) toast.error(r.error);
      else toast.success(t("panic.locked"));
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="w-full rounded-2xl bg-red-600 text-white text-sm font-semibold px-4 py-3 shadow-lg hover:bg-red-700 disabled:opacity-50"
    >
      {isPending ? "…" : t("panic.staffLock")}
    </button>
  );
}
