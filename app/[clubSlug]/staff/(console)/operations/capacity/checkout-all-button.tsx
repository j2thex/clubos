"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { checkoutAllOpen } from "../entry/actions";

export function CheckoutAllButton({
  clubId,
  clubSlug,
  count,
}: {
  clubId: string;
  clubSlug: string;
  count: number;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(t("ops.capacity.checkoutAllConfirm", { count }))) return;
    startTransition(async () => {
      const r = await checkoutAllOpen(clubId, clubSlug);
      if ("error" in r) toast.error(r.error);
      else toast.success(t("ops.capacity.allCheckedOut", { count: r.count }));
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending || count === 0}
      className="rounded-full bg-red-600 text-white text-xs font-semibold px-4 py-1.5 hover:bg-red-700 disabled:opacity-50"
    >
      {isPending ? "…" : t("ops.capacity.checkoutAll")}
    </button>
  );
}
