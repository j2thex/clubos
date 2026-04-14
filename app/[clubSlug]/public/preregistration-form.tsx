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
    <div className="m-card p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[color:var(--m-ink)]">
            {t("public.preregTitle")}
          </p>
          <p className="text-xs text-[color:var(--m-ink-muted)]">
            {t("public.preregDesc")}
          </p>
        </div>
        {!sent && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="m-btn-ink shrink-0 rounded-[var(--m-radius-sm)] px-4 py-2 text-xs font-semibold"
          >
            {t("public.preregButton")}
          </button>
        )}
        {sent && (
          <span className="shrink-0 rounded-[var(--m-radius-xs)] bg-green-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-green-800">
            {t("public.preregSent")}
          </span>
        )}
      </div>

      {sent && (
        <p className="mt-2 text-xs text-[color:var(--m-ink-muted)]">
          {t("public.preregSentDesc")}
        </p>
      )}

      {expanded && !sent && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div>
            <label className="m-caption mb-1 block">{t("public.preregVisitDate")}</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              min={today}
              required
              className="w-full rounded-[var(--m-radius-sm)] border border-gray-200 px-3 py-2 text-sm text-[color:var(--m-ink)] transition focus:border-[color:var(--m-ink)] focus:outline-none"
            />
          </div>
          <div>
            <label className="m-caption mb-1 block">{t("public.preregEmail")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-[var(--m-radius-sm)] border border-gray-200 px-3 py-2 text-sm text-[color:var(--m-ink)] transition placeholder:text-gray-400 focus:border-[color:var(--m-ink)] focus:outline-none"
            />
          </div>
          <div>
            <label className="m-caption mb-1 block">
              {t("public.preregNumVisitors")}
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNumVisitors(n)}
                  className={`flex-1 rounded-[var(--m-radius-sm)] border py-2 text-sm font-medium transition-colors ${
                    numVisitors === n
                      ? "border-[color:var(--m-ink)] bg-[color:var(--m-ink)] text-white"
                      : "border-gray-200 text-[color:var(--m-ink)] hover:border-gray-400"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              required
              className="mt-0.5 rounded border-gray-300 text-[color:var(--m-ink)]"
            />
            <span className="text-xs text-[color:var(--m-ink-muted)]">
              {t("public.preregAgeConfirm")}
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={disclaimerAccepted}
              onChange={(e) => setDisclaimerAccepted(e.target.checked)}
              required
              className="mt-0.5 rounded border-gray-300 text-[color:var(--m-ink)]"
            />
            <span className="text-xs text-[color:var(--m-ink-muted)]">
              {t("public.preregDisclaimer")}
            </span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !ageConfirmed || !disclaimerAccepted}
              className="m-btn-ink flex-1 rounded-[var(--m-radius-sm)] py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? t("public.preregSubmitting") : t("public.preregSubmit")}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="rounded-[var(--m-radius-sm)] border border-gray-200 px-4 py-2.5 text-sm text-[color:var(--m-ink-muted)] transition-colors hover:bg-gray-50"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
