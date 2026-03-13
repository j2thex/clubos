"use client";

import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { loginOwner } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

export default function AdminLoginPage() {
  const params = useParams<{ clubSlug: string }>();
  const clubSlug = params.clubSlug;

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  const boundLogin = loginOwner.bind(null, clubSlug);

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t("login.adminTitle")}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t("login.adminSubtitle")}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t("login.emailLabel")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("login.emailPlaceholder")}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                {t("login.passwordLabel")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="current-password"
                placeholder={t("login.passwordPlaceholder")}
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
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
