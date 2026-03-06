"use client";

import { useParams } from "next/navigation";
import { useState, useTransition } from "react";
import { loginMember } from "./actions";

export default function MemberLoginPage() {
  const params = useParams<{ clubSlug: string }>();
  const clubSlug = params.clubSlug;

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const boundLogin = loginMember.bind(null, clubSlug);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-100 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mb-4">
              <svg
                className="w-7 h-7 text-green-600"
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
            <h1 className="text-2xl font-bold text-gray-900">Member Login</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter your member code and PIN
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
                htmlFor="memberCode"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Member Code
              </label>
              <input
                id="memberCode"
                name="memberCode"
                type="text"
                required
                maxLength={6}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="ABC123"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg font-mono tracking-widest uppercase placeholder:text-gray-400 placeholder:tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
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
                PIN
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                required
                maxLength={4}
                inputMode="numeric"
                pattern="[0-9]{4}"
                autoComplete="off"
                placeholder="----"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg tracking-[0.5em] placeholder:tracking-[0.5em] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Contact your club administrator if you need help signing in.
        </p>
      </div>
    </div>
  );
}
