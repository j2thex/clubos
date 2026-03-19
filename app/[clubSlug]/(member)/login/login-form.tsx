"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { loginMember } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

export function LoginForm({ loginMode }: { loginMode: string }) {
  const params = useParams<{ clubSlug: string }>();
  const clubSlug = params.clubSlug;
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "1";

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useLanguage();

  const boundLogin = loginMember.bind(null, clubSlug, locale);
  const showExpiry = loginMode === "code_and_expiry";

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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--club-primary, #16a34a) 8%, white), white, color-mix(in srgb, var(--club-primary, #16a34a) 12%, white))" }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full club-tint-bg mb-4">
              <svg
                className="w-7 h-7 club-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("login.memberTitle")}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t("login.memberSubtitle")}
            </p>
          </div>

          {isExpired && !error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {t("login.membershipExpiredGeneric")}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="memberCode"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t("common.memberCode")}
              </label>
              <input
                id="memberCode"
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
            </div>

            {showExpiry && (
              <div>
                <label
                  htmlFor="expiryCode"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {t("login.expiryCode")}
                </label>
                <input
                  id="expiryCode"
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
                <p className="text-xs text-gray-400 mt-1 text-center">
                  {t("login.expiryCodeHint")}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="club-btn w-full rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? t("common.signingIn") : t("common.signIn")}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          {t("login.contactAdminHelp")}
        </p>
        <p className="text-center text-xs text-gray-300 mt-2">
          <a href="/privacy" className="underline hover:text-gray-500 transition-colors">{t("legal.privacyPolicy")}</a>
          {" · "}
          <a href="/terms" className="underline hover:text-gray-500 transition-colors">{t("legal.termsOfUse")}</a>
        </p>
      </div>
    </div>
  );
}
