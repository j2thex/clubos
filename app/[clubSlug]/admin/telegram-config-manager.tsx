"use client";

import { useState, useTransition } from "react";
import { updateTelegramConfig, testTelegramNotification } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

export function TelegramConfigManager({
  botToken,
  chatId,
  clubId,
  clubSlug,
}: {
  botToken: string | null;
  chatId: string | null;
  clubId: string;
  clubSlug: string;
}) {
  const [token, setToken] = useState(botToken ?? "");
  const [chat, setChat] = useState(chatId ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { t } = useLanguage();

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateTelegramConfig(clubId, token.trim(), chat.trim(), clubSlug);
      if ("error" in result) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: t("admin.telegramSaved") });
        setTimeout(() => setMessage(null), 3000);
      }
    });
  }

  function handleTest() {
    setMessage(null);
    startTransition(async () => {
      const result = await testTelegramNotification(clubId, clubSlug);
      if ("error" in result) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: t("admin.telegramTestSent") });
        setTimeout(() => setMessage(null), 5000);
      }
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        {t("admin.telegramTitle")}
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-400">
            {t("admin.telegramDesc")}
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.telegramBotToken")}</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 font-mono placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {(() => {
                const hint = t("admin.telegramBotTokenHint");
                const parts = hint.split("@BotFather");
                if (parts.length === 1) return hint;
                return (
                  <>
                    {parts[0]}
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-gray-600"
                    >
                      @BotFather
                    </a>
                    {parts.slice(1).join("@BotFather")}
                  </>
                );
              })()}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.telegramChatId")}</label>
            <input
              type="text"
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder="-1001234567890"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 font-mono placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
            <p className="text-[10px] text-gray-400 mt-1">{t("admin.telegramChatIdHint")}</p>
          </div>

          {message && (
            <div className={`rounded-lg px-3 py-2 text-xs font-medium ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 rounded-lg bg-gray-800 text-white text-xs font-semibold py-2 hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? t("common.loading") : t("common.save")}
            </button>
            {token && chat && (
              <button
                onClick={handleTest}
                disabled={isPending}
                className="rounded-lg border border-gray-300 text-xs font-semibold text-gray-600 px-4 py-2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {t("admin.telegramTest")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
