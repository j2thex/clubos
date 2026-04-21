"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { loginStaff } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

export default function StaffLoginPage() {
  const params = useParams<{ clubSlug: string }>();
  const clubSlug = params.clubSlug;
  const searchParams = useSearchParams();
  const wrongClub = searchParams.get("reason") === "wrong-club";

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t, locale } = useLanguage();

  const boundLogin = loginStaff.bind(null, clubSlug, locale);

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50" style={{ colorScheme: "light" }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
              <svg
                className="w-7 h-7 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("login.staffTitle")}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t("login.staffSubtitle")}
            </p>
          </div>

          {wrongClub && !error && (
            <div className="mb-6 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              {t("staff.login.wrongClubNotice")}
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
                htmlFor="staffCode"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t("common.staffCode")}
              </label>
              <input
                id="staffCode"
                name="staffCode"
                type="text"
                required
                maxLength={6}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder={t("login.staffCodePlaceholder")}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg font-mono tracking-widest uppercase text-gray-900 placeholder:text-gray-400 placeholder:tracking-widest transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
            </div>

            <div>
              <label
                htmlFor="pin"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t("common.pin")}
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                required
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]{4}"
                autoComplete="one-time-code"
                placeholder={t("login.pinPlaceholder")}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg tracking-[0.5em] text-gray-900 placeholder:tracking-[0.5em] placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? t("common.signingIn") : t("common.signIn")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
