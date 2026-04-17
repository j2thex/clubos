"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { checkoutEntry } from "../entry/actions";

export function CheckoutButton({
  entryId,
  memberCode,
  clubSlug,
}: {
  entryId: string;
  memberCode: string;
  clubSlug: string;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!window.confirm(t("ops.capacity.checkoutConfirm", { code: memberCode }))) return;
    startTransition(async () => {
      const res = await checkoutEntry(entryId, clubSlug);
      if ("error" in res) toast.error(res.error);
      else toast.success(t("ops.capacity.checkedOut", { code: memberCode }));
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full bg-gray-800 text-white text-xs font-semibold px-3 py-1 hover:bg-gray-700 disabled:opacity-50"
    >
      {isPending ? "…" : t("ops.capacity.checkoutBtn")}
    </button>
  );
}
