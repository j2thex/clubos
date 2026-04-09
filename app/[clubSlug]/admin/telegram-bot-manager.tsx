"use client";

import { useState, useTransition } from "react";
import { updateTelegramBotConfig } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

export function TelegramBotManager({
  enabled,
  referralName,
  registrationPrice,
  welcomeMessage,
  keywords,
  ageRestricted,
  clubId,
  clubSlug,
}: {
  enabled: boolean;
  referralName: string | null;
  registrationPrice: number | null;
  welcomeMessage: string | null;
  keywords: string[];
  ageRestricted: boolean;
  clubId: string;
  clubSlug: string;
}) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [name, setName] = useState(referralName ?? "");
  const [price, setPrice] = useState(registrationPrice?.toString() ?? "");
  const [welcome, setWelcome] = useState(welcomeMessage ?? "");
  const [keywordsText, setKeywordsText] = useState(keywords.join(", "));
  const [isAgeRestricted, setIsAgeRestricted] = useState(ageRestricted);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { t } = useLanguage();

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const parsedKeywords = keywordsText
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      const result = await updateTelegramBotConfig(
        clubId,
        {
          telegram_bot_enabled: isEnabled,
          telegram_bot_referral_name: name.trim() || null,
          telegram_bot_registration_price: price ? parseFloat(price) : null,
          telegram_bot_welcome_message: welcome.trim() || null,
          telegram_bot_keywords: parsedKeywords,
          telegram_bot_age_restricted: isAgeRestricted,
        },
        clubSlug,
      );
      if ("error" in result) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: t("admin.telegramBotSaved") });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-400">
            {t("admin.telegramBotDesc")}
          </p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <span className="text-sm font-medium text-gray-700">
              {t("admin.telegramBotEnabled")}
            </span>
          </label>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t("admin.telegramBotReferralName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Valentina"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {t("admin.telegramBotReferralNameHint")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t("admin.telegramBotKeywords")}
            </label>
            <input
              type="text"
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="eleve, élevé, lev, elevé"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {t("admin.telegramBotKeywordsHint")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t("admin.telegramBotRegPrice")}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="50.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {t("admin.telegramBotRegPriceHint")}
            </p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAgeRestricted}
              onChange={(e) => setIsAgeRestricted(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <span className="text-sm font-medium text-gray-700">
              {t("admin.telegramBotAgeRestricted")}
            </span>
          </label>
          <p className="text-[10px] text-gray-400 -mt-1 ml-7">
            {t("admin.telegramBotAgeRestrictedHint")}
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {t("admin.telegramBotWelcome")}
            </label>
            <textarea
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
              placeholder="Welcome to our club!"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {t("admin.telegramBotWelcomeHint")}
            </p>
          </div>

          {message && (
            <div className={`rounded-lg px-3 py-2 text-xs font-medium ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-full rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? t("common.loading") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
