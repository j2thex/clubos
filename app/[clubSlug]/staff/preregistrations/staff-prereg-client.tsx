"use client";

import { useState, useTransition } from "react";
import { confirmPreregistration, denyPreregistration } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

interface Preregistration {
  id: string;
  email: string;
  visit_date: string;
  num_visitors: number;
  status: string;
  created_at: string;
}

type Feedback = { type: "confirmed" } | { type: "denied" } | { type: "error"; message: string };

export function StaffPreregClient({
  initialPreregistrations,
  clubSlug,
  staffMemberId,
}: {
  initialPreregistrations: Preregistration[];
  clubSlug: string;
  staffMemberId: string;
}) {
  const [pending, setPending] = useState(
    initialPreregistrations.filter((p) => p.status === "pending"),
  );
  const [reviewed, setReviewed] = useState(
    initialPreregistrations.filter((p) => p.status !== "pending"),
  );
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  function handleConfirm(id: string) {
    setFeedback((prev) => { const next = { ...prev }; delete next[id]; return next; });
    startTransition(async () => {
      const res = await confirmPreregistration(id, staffMemberId, clubSlug);
      if ("error" in res) {
        setFeedback((prev) => ({ ...prev, [id]: { type: "error", message: res.error } }));
        return;
      }
      const item = pending.find((p) => p.id === id);
      setFeedback((prev) => ({ ...prev, [id]: { type: "confirmed" } }));
      setPending((prev) => prev.filter((p) => p.id !== id));
      if (item) setReviewed((prev) => [{ ...item, status: "confirmed" }, ...prev]);
    });
  }

  function handleDeny(id: string) {
    setFeedback((prev) => { const next = { ...prev }; delete next[id]; return next; });
    startTransition(async () => {
      const res = await denyPreregistration(id, staffMemberId, clubSlug);
      if ("error" in res) {
        setFeedback((prev) => ({ ...prev, [id]: { type: "error", message: res.error } }));
        return;
      }
      const item = pending.find((p) => p.id === id);
      setFeedback((prev) => ({ ...prev, [id]: { type: "denied" } }));
      setPending((prev) => prev.filter((p) => p.id !== id));
      if (item) setReviewed((prev) => [{ ...item, status: "denied" }, ...prev]);
    });
  }

  function formatDate(dateStr: string) {
    try {
      return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  function formatTimestamp(ts: string) {
    try {
      return new Date(ts).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  }

  return (
    <div className="space-y-4">
      {/* Pending */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">
            {t("staff.pendingPreregs", { count: String(pending.length) })}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
            {pending.map((p) => {
              const fb = feedback[p.id];
              if (fb?.type === "confirmed") {
                return (
                  <div key={p.id} className="px-5 py-3 bg-green-50">
                    <span className="text-xs text-green-700 font-medium">
                      {t("staff.preregConfirmed")} — {p.email}
                    </span>
                  </div>
                );
              }
              if (fb?.type === "denied") {
                return (
                  <div key={p.id} className="px-5 py-3 bg-gray-50">
                    <span className="text-xs text-gray-500">
                      {t("staff.preregDenied")} — {p.email}
                    </span>
                  </div>
                );
              }
              return (
                <div key={p.id} className="px-5 py-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(p.visit_date)}
                        <span className="ml-2 text-xs text-gray-400">
                          {p.num_visitors} {t("staff.preregVisitors")}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 truncate">{p.email}</p>
                      <p className="text-[10px] text-gray-400">{formatTimestamp(p.created_at)}</p>
                    </div>
                    <button
                      onClick={() => handleDeny(p.id)}
                      disabled={isPending}
                      className="text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {t("staff.preregDeny")}
                    </button>
                    <button
                      onClick={() => handleConfirm(p.id)}
                      disabled={isPending}
                      className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {t("staff.preregConfirm")}
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
      )}

      {/* Empty state */}
      {pending.length === 0 && reviewed.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900">{t("staff.noPreregs")}</p>
          <p className="text-xs text-gray-400 mt-1">{t("staff.preregsDesc")}</p>
        </div>
      )}

      {/* Reviewed */}
      {reviewed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">
            {t("staff.reviewedPreregs", { count: String(reviewed.length) })}
          </h2>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
            {reviewed.map((p) => (
              <div key={p.id} className="px-5 py-2.5 flex items-center justify-between opacity-60">
                <div className="min-w-0">
                  <p className="text-sm text-gray-700">
                    {formatDate(p.visit_date)}
                    <span className="ml-2 text-xs text-gray-400">
                      {p.num_visitors} {t("staff.preregVisitors")}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 truncate">{p.email}</p>
                </div>
                <span className={`text-xs font-medium flex items-center gap-1 ${
                  p.status === "confirmed" ? "text-green-600" : "text-red-500"
                }`}>
                  {p.status === "confirmed" ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {t("staff.preregConfirmed")}
                    </>
                  ) : (
                    t("staff.preregDenied")
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
