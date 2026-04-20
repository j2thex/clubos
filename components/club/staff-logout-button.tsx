"use client";

import { useTransition } from "react";
import { logoutStaff } from "@/app/[clubSlug]/staff/actions";
import { useLanguage } from "@/lib/i18n/provider";

export function StaffLogoutButton({ clubSlug }: { clubSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => startTransition(() => logoutStaff(clubSlug))}
      disabled={isPending}
      className="text-xs text-gray-400 hover:text-white border border-gray-600 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
    >
      {isPending ? t("common.loggingOut") : t("common.logout")}
    </button>
  );
}
