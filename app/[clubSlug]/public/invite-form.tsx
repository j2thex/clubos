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
    <div className="bg-white rounded-2xl shadow p-4">
      {referrerCode && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-3 text-center">
          <p className="text-xs font-medium text-amber-700">{t("public.invitedByMember")}</p>
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 club-tint-bg club-primary">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{t("public.getInvite")}</p>
          <p className="text-xs text-gray-400">{t("public.getInviteDesc")}</p>
        </div>
        {!sent && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="shrink-0 text-xs font-semibold club-btn rounded-full px-4 py-1.5"
          >
            {t("public.requestInvite")}
          </button>
        )}
        {sent && (
          <span className="shrink-0 text-xs font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
            {t("public.inviteSent")}
          </span>
        )}
      </div>

      {expanded && !sent && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("public.yourName")}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          />
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("public.contactPlaceholder")}
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("public.whyJoin")}
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
          />
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
              className="mt-0.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <span className="text-xs text-gray-500">
              {t("legal.consentPrefix")}{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline text-gray-700">{t("legal.privacyPolicy")}</a>
              {" "}{t("legal.consentAnd")}{" "}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline text-gray-700">{t("legal.termsOfUse")}</a>
            </span>
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !consent}
              className="flex-1 rounded-lg club-btn py-2 text-sm font-semibold disabled:opacity-50"
            >
              {isPending ? t("public.sending") : t("public.sendRequest")}
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
