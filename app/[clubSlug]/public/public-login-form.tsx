"use client";

import { useState, useTransition } from "react";
import { loginMember } from "../(member)/login/actions";
import { useLanguage } from "@/lib/i18n/provider";

export function PublicLoginForm({
  loginMode,
  clubSlug,
}: {
  loginMode: string;
  clubSlug: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useLanguage();
  const showExpiry = loginMode === "code_and_expiry";

  const boundLogin = loginMember.bind(null, clubSlug, locale);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await boundLogin(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <input
        name="memberCode"
        type="text"
        required
        maxLength={8}
        autoCapitalize="characters"
        autoComplete="off"
        placeholder={t("login.memberCodePlaceholder")}
        className="club-ring block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg font-mono tracking-widest uppercase placeholder:text-gray-400 placeholder:tracking-widest transition"
        onChange={(e) => {
          e.target.value = e.target.value.toUpperCase();
        }}
      />
      {showExpiry && (
        <input
          name="expiryCode"
          type="text"
          required
          maxLength={4}
          inputMode="numeric"
          autoComplete="off"
          placeholder="DDMM"
          className="club-ring block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg font-mono tracking-widest placeholder:text-gray-400 placeholder:tracking-widest transition"
          onChange={(e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
          }}
        />
      )}
      <button
        type="submit"
        disabled={isPending}
        className="club-btn w-full rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? t("common.signingIn") : t("common.signIn")}
      </button>
    </form>
  );
}
