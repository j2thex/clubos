"use client";

import { useState, useTransition } from "react";
import { requestInvite } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

export function InviteForm({ clubId, clubName, referrerCode }: { clubId: string; clubName: string; referrerCode?: string }) {
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fullMessage = referrerCode
      ? `${message ? message + "\n" : ""}Referred by: ${referrerCode}`
      : message || undefined;
    startTransition(async () => {
      const result = await requestInvite(clubId, clubName, name, contact, fullMessage);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  }

  return (
    <div className="m-card p-4">
      {referrerCode && (
        <div className="mb-3 rounded-[var(--m-radius-sm)] border border-amber-100 bg-amber-50 px-3 py-2 text-center">
          <p className="text-xs font-semibold text-amber-800">{t("public.invitedByMember")}</p>
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="club-tint-bg club-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
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
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[color:var(--m-ink)]">
            {t("public.getInvite")}
          </p>
          <p className="text-xs text-[color:var(--m-ink-muted)]">
            {t("public.getInviteDesc")}
          </p>
        </div>
        {!sent && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="club-btn shrink-0 rounded-[var(--m-radius-sm)] px-4 py-2 text-xs font-semibold"
          >
            {t("public.requestInvite")}
          </button>
        )}
        {sent && (
          <span className="shrink-0 rounded-[var(--m-radius-xs)] bg-green-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-green-800">
            {t("public.inviteSent")}
          </span>
        )}
      </div>

      {expanded && !sent && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("public.yourName")}
            required
            className="w-full rounded-[var(--m-radius-sm)] border border-gray-200 px-3 py-2 text-sm text-[color:var(--m-ink)] transition placeholder:text-gray-400 focus:border-[color:var(--m-ink)] focus:outline-none"
          />
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("public.contactPlaceholder")}
            required
            className="w-full rounded-[var(--m-radius-sm)] border border-gray-200 px-3 py-2 text-sm text-[color:var(--m-ink)] transition placeholder:text-gray-400 focus:border-[color:var(--m-ink)] focus:outline-none"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("public.whyJoin")}
            rows={2}
            className="w-full resize-none rounded-[var(--m-radius-sm)] border border-gray-200 px-3 py-2 text-sm text-[color:var(--m-ink)] transition placeholder:text-gray-400 focus:border-[color:var(--m-ink)] focus:outline-none"
          />
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-0.5 rounded border-gray-300 text-[color:var(--m-ink)]"
            />
            <span className="text-xs text-[color:var(--m-ink-muted)]">
              {t("legal.consentPrefix")}{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[color:var(--m-ink)]"
              >
                {t("legal.privacyPolicy")}
              </a>{" "}
              {t("legal.consentAnd")}{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[color:var(--m-ink)]"
              >
                {t("legal.termsOfUse")}
              </a>
            </span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !consent}
              className="club-btn flex-1 rounded-[var(--m-radius-sm)] py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? t("public.sending") : t("public.sendRequest")}
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
