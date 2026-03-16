"use client";

import { useState, useTransition } from "react";
import { useParams } from "next/navigation";
import { resetPassword } from "../login/reset-actions";

export function ResetForm({ token }: { token: string }) {
  const params = useParams<{ clubSlug: string }>();
  const clubSlug = params.clubSlug;

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await resetPassword(token, password);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Password updated successfully.
        </div>
        <a
          href={`/${clubSlug}/admin/login`}
          className="block w-full rounded-lg bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-700 transition-colors text-center"
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Minimum 8 characters"
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Repeat password"
            className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm placeholder:text-gray-400 transition focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? "Updating..." : "Set new password"}
        </button>
      </form>
    </>
  );
}
