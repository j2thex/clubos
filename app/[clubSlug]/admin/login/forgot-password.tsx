"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "./reset-actions";

export function ForgotPassword({
  clubSlug,
  onBack,
}: {
  clubSlug: string;
  onBack: () => void;
}) {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const email = (formData.get("email") as string)?.trim();
    if (!email) return;

    startTransition(async () => {
      await requestPasswordReset(clubSlug, email);
      setSent(true);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {sent ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                If an account exists with that email, we&apos;ve sent a reset link. Check your inbox.
              </div>
              <button
                onClick={onBack}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form action={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  id="resetEmail"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? "Sending..." : "Send reset link"}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Back to login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
