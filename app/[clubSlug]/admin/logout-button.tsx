"use client";

import { useTransition } from "react";
import { logoutOwner } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

export function LogoutButton({ clubSlug }: { clubSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => startTransition(() => logoutOwner(clubSlug))}
      disabled={isPending}
      className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
    >
      {isPending ? t("common.loggingOut") : t("common.logout")}
    </button>
  );
}
