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
    <div className="px-4 py-3">
      <p className="m-caption">{t("profile.email")}</p>
      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("profile.emailPlaceholder")}
          className="flex-1 rounded-[var(--m-radius-sm)] border border-gray-200 px-3 py-2 text-sm text-[color:var(--m-ink)] outline-none transition-colors focus:border-[color:var(--m-ink)]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-[var(--m-radius-sm)] bg-[color:var(--m-ink,#0a0a0a)] px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50 hover:brightness-90"
        >
          {t("profile.saveEmail")}
        </button>
      </form>
    </div>
  );
}
