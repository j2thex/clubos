"use client";

import { useState, useTransition } from "react";
import { submitPreregistration } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

export function PreregistrationForm({ clubId, clubName }: { clubId: string; clubName: string }) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [visitDate, setVisitDate] = useState(today);
  const [numVisitors, setNumVisitors] = useState(1);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitPreregistration(
        clubId,
        clubName,
        email.trim(),
        visitDate,
        numVisitors,
        ageConfirmed,
        disclaimerAccepted,
      );
      if ("error" in result) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-blue-50 text-blue-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{t("public.preregTitle")}</p>
          <p className="text-xs text-gray-400">{t("public.preregDesc")}</p>
        </div>
        {!sent && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="shrink-0 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-full px-4 py-1.5 transition-colors"
          >
            {t("public.preregButton")}
          </button>
        )}
        {sent && (
          <span className="shrink-0 text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
            {t("public.preregSent")}
          </span>
        )}
      </div>

      {sent && (
        <p className="mt-2 text-xs text-gray-400">{t("public.preregSentDesc")}</p>
      )}

      {expanded && !sent && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("public.preregVisitDate")}</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              min={today}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("public.preregEmail")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("public.preregNumVisitors")}</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumVisitors(n)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                    numVisitors === n
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              required
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
            />
            <span className="text-xs text-gray-500">{t("public.preregAgeConfirm")}</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              required
              className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
            />
            <span className="text-xs text-gray-500">{t("public.preregDisclaimer")}</span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !ageConfirmed || !disclaimerAccepted}
              className="flex-1 rounded-lg bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? t("public.preregSubmitting") : t("public.preregSubmit")}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
