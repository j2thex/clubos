"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { exportFinanceRangeCsv } from "./actions";

export function ExportFinanceButton({
  clubId,
  fromIso,
  toIso,
}: {
  clubId: string;
  fromIso: string;
  toIso: string;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const r = await exportFinanceRangeCsv(clubId, fromIso, toIso);
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full bg-gray-100 text-gray-700 text-sm font-semibold px-4 py-1.5 hover:bg-gray-200 disabled:opacity-50"
    >
      {isPending ? "…" : t("finance.export")}
    </button>
  );
}
