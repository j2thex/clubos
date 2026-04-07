"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { updateEmail } from "./actions";

export function EmailField({
  currentEmail,
  memberId,
}: {
  currentEmail: string | null;
  memberId: string;
}) {
  const [email, setEmail] = useState(currentEmail ?? "");
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateEmail(memberId, email);
      if ("error" in result) {
        if (result.error === "invalid") {
          toast.error(t("profile.emailInvalid"));
        } else {
          toast.error(result.error);
        }
      } else {
        toast.success(t("profile.emailSaved"));
      }
    });
  }

  return (
    <div className="px-6 py-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {t("profile.email")}
      </p>
      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("profile.emailPlaceholder")}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-gray-400 transition-colors"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-gray-800 text-white px-4 py-1.5 text-xs font-semibold disabled:opacity-50 transition-opacity"
        >
          {t("profile.saveEmail")}
        </button>
      </form>
    </div>
  );
}
