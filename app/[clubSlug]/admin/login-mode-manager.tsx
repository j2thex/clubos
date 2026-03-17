"use client";

import { useTransition } from "react";
import { updateLoginMode, updateInviteOnly } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

export function LoginModeManager({
  loginMode,
  inviteOnly,
  clubId,
  clubSlug,
}: {
  loginMode: string;
  inviteOnly: boolean;
  clubId: string;
  clubSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  function handleChange(mode: string) {
    startTransition(async () => {
      await updateLoginMode(clubId, mode, clubSlug);
    });
  }

  function handleInviteToggle(checked: boolean) {
    startTransition(async () => {
      await updateInviteOnly(clubId, checked, clubSlug);
    });
  }

  const options = [
    {
      value: "code_only",
      label: t("admin.codeOnly"),
      description: t("admin.codeOnlyDesc"),
    },
    {
      value: "code_and_expiry",
      label: t("admin.codeAndExpiry"),
      description: t("admin.codeAndExpiryDesc"),
    },
  ];

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t("admin.memberLogin")}
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden divide-y divide-gray-100">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}
          >
            <input
              type="radio"
              name="loginMode"
              value={opt.value}
              checked={loginMode === opt.value}
              onChange={() => handleChange(opt.value)}
              className="mt-0.5 rounded-full border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{opt.description}</p>
            </div>
          </label>
        ))}
        <label
          className={`flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${isPending ? "opacity-50 pointer-events-none" : ""}`}
        >
          <input
            type="checkbox"
            checked={inviteOnly}
            onChange={(e) => handleInviteToggle(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">{t("admin.inviteOnly")}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t("admin.inviteOnlyDesc")}</p>
          </div>
        </label>
      </div>
    </div>
  );
}
