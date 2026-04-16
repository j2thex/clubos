"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/i18n/provider";

export function WelcomeOverlay({ clubName }: { clubName: string }) {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (localStorage.getItem("clubos-welcome-seen")) return;
    setShow(true);
  }, []);

  function dismiss() {
    localStorage.setItem("clubos-welcome-seen", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 pb-24">
      <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full max-h-[90svh] overflow-y-auto p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-300">
        <div className="text-center">
          <p className="text-2xl mb-1">👋</p>
          <h2 className="text-lg font-bold text-gray-900">
            {t("welcome.title", { club: clubName })}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {t("welcome.subtitle")}
          </p>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{t("welcome.quests")}</p>
              <p className="text-xs text-gray-500">{t("welcome.questsDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
            <span className="text-lg">🎰</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{t("welcome.spin")}</p>
              <p className="text-xs text-gray-500">{t("welcome.spinDesc")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">{t("welcome.events")}</p>
              <p className="text-xs text-gray-500">{t("welcome.eventsDesc")}</p>
            </div>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="w-full club-btn py-3 rounded-lg text-sm font-bold shadow"
        >
          {t("welcome.start")}
        </button>
      </div>
    </div>
  );
}
