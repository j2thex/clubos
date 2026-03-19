"use client";

import { useState, useTransition } from "react";
import { fulfillSpinPrize } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

interface Prize {
  id: string;
  outcomeLabel: string;
  outcomeValue: number;
  createdAt: string;
  memberCode: string;
  memberName: string | null;
}

export function PendingPrizes({
  clubId,
  prizes: initialPrizes,
}: {
  clubId: string;
  prizes: Prize[];
}) {
  const { t } = useLanguage();
  const [prizes, setPrizes] = useState(initialPrizes);
  const [fulfillingId, setFulfillingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFulfill(spinId: string) {
    setFulfillingId(spinId);
    startTransition(async () => {
      const res = await fulfillSpinPrize(spinId, clubId);
      if (!("error" in res)) {
        setPrizes((prev) => prev.filter((p) => p.id !== spinId));
      }
      setFulfillingId(null);
    });
  }

  if (prizes.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">
          {t("staff.pendingPrizes", { count: prizes.length })}
        </h2>
      </div>
      <div className="divide-y divide-gray-50">
        {prizes.map((prize) => (
          <div key={prize.id} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-gray-900">
                  {prize.memberCode}
                </span>
                {prize.memberName && (
                  <span className="text-xs text-gray-400 truncate">
                    {prize.memberName}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-purple-700 mt-0.5">
                {prize.outcomeLabel}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date(prize.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <button
              onClick={() => handleFulfill(prize.id)}
              disabled={isPending && fulfillingId === prize.id}
              className="rounded-lg bg-gray-800 text-white px-4 py-2 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {isPending && fulfillingId === prize.id
                ? t("staff.fulfilling")
                : t("staff.fulfill")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
