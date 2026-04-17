"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { exportTodayTransactionsCsv } from "../sell/actions";

export function ExportCsvButton({ clubId }: { clubId: string }) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const r = await exportTodayTransactionsCsv(clubId);
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
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs rounded-full px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
    >
      {isPending ? "…" : t("ops.tx.exportCsv")}
    </button>
  );
}
