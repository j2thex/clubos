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
    <form action={handleSubmit} className="space-y-3" style={{ colorScheme: "light" }}>
      {error && (
        <div className="rounded-[var(--m-radius-sm)] border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
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
        className="club-ring block w-full rounded-[var(--m-radius-sm)] border border-gray-300 px-4 py-3 text-center font-mono text-2xl uppercase tracking-[0.2em] text-gray-900 transition placeholder:text-base placeholder:tracking-[0.2em] placeholder:text-gray-400"
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
          className="club-ring block w-full rounded-[var(--m-radius-sm)] border border-gray-300 px-4 py-2.5 text-center font-mono text-lg tracking-widest text-gray-900 transition placeholder:tracking-widest placeholder:text-gray-400"
          onChange={(e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
          }}
        />
      )}
      <button
        type="submit"
        disabled={isPending}
        className="club-btn w-full rounded-[var(--m-radius-sm)] px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? t("common.signingIn") : t("common.signIn")}
      </button>
    </form>
  );
}
