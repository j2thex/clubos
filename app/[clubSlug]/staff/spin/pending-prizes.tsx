"use client";

import { useState, useTransition } from "react";
import { approveBonus } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

interface Bonus {
  id: string;
  outcomeLabel: string;
  createdAt: string;
  memberCode: string;
  memberName: string | null;
}

type ItemFeedback = { type: "approved" } | { type: "error"; message: string };

export function PendingPrizes({
  clubId,
  prizes: initialPrizes,
}: {
  clubId: string;
  prizes: Bonus[];
}) {
  const { t } = useLanguage();
  const [bonuses, setBonuses] = useState(initialPrizes);
  const [isPending, startTransition] = useTransition();
  const [itemFeedback, setItemFeedback] = useState<Record<string, ItemFeedback>>({});

  function handleApprove(spinId: string) {
    setItemFeedback((prev) => {
      const next = { ...prev };
      delete next[spinId];
      return next;
    });
    startTransition(async () => {
      const res = await approveBonus(spinId, clubId);
      if ("error" in res) {
        setItemFeedback((prev) => ({ ...prev, [spinId]: { type: "error", message: res.error } }));
        return;
      }
      setItemFeedback((prev) => ({ ...prev, [spinId]: { type: "approved" } }));
      setBonuses((prev) => prev.filter((b) => b.id !== spinId));
    });
  }

  const feedbackOnlyIds = Object.keys(itemFeedback).filter(
    (id) => !bonuses.some((b) => b.id === id) && itemFeedback[id].type === "approved",
  );

  if (bonuses.length === 0 && feedbackOnlyIds.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900">{t("staff.noBonusesPending")}</p>
        <p className="text-xs text-gray-400 mt-1">{t("staff.bonusesEmptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t("staff.pendingBonuses", { count: bonuses.length })}
        </h3>
      </div>
      <div className="divide-y divide-gray-100">
        {feedbackOnlyIds.map((id) => (
          <div key={id} className="px-5 py-3 bg-green-50">
            <span className="text-xs text-green-700 font-medium">{t("staff.bonusApproved")}</span>
          </div>
        ))}

        {bonuses.map((b) => {
          const fb = itemFeedback[b.id];
          return (
            <div key={b.id} className="px-5 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-700">{b.outcomeLabel}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="font-mono font-bold text-gray-600">{b.memberCode}</span>
                    {b.memberName && ` — ${b.memberName}`}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(b.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleApprove(b.id)}
                  disabled={isPending}
                  className="rounded-lg bg-green-600 text-white px-4 py-1.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors shrink-0"
                >
                  {t("staff.approveBonus")}
                </button>
              </div>
              {fb?.type === "error" && (
                <p className="text-xs text-red-600">{fb.message}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
