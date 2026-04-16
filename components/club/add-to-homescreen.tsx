"use client";

import { useState, useEffect } from "react";
import { Share, Bell, X } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/lib/i18n/provider";
import { AddToHomescreenModal } from "./add-to-homescreen-modal";
import {
  registerServiceWorker,
  subscribeToPush,
  getExistingSubscription,
} from "@/lib/push/client";
import { savePushSubscription } from "@/app/[clubSlug]/(member)/push-actions";

// Set to `true` during QA: install banner shows on every member-home load,
// ignoring the once-only flag. Flip to `false` in a follow-up one-line PR once
// Mikita signs off on staging. Does NOT gate the subscribe state — that state
// always shows until the user has subscribed, then hides forever.
const A2HS_TEST_MODE = true;

type Mode = "hidden" | "install" | "subscribe";

export function AddToHomescreen({ clubSlug }: { clubSlug: string }) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [modalOpen, setModalOpen] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;

    async function detect() {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;

      if (isStandalone) {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          return;
        }
        await registerServiceWorker();
        const existing = await getExistingSubscription();
        if (cancelled) return;
        if (existing) return;
        setMode("subscribe");
        return;
      }

      const ua = navigator.userAgent;
      const isIOS = /iPhone|iPad|iPod/.test(ua);
      if (!isIOS) return;

      if (A2HS_TEST_MODE) {
        setMode("install");
        return;
      }

      const key = `clubos-a2hs-${clubSlug}-seen`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
      setMode("install");
    }

    void detect();
    return () => {
      cancelled = true;
    };
  }, [clubSlug]);

  function dismiss() {
    setMode("hidden");
  }

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        toast.error("Push not configured");
        return;
      }
      const sub = await subscribeToPush(vapidKey);
      if (!sub) {
        toast.error(t("a2hs.blocked"));
        return;
      }
      const json = sub.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        toast.error("Subscription incomplete");
        return;
      }
      const result = await savePushSubscription({
        clubSlug,
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        userAgent: navigator.userAgent,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("a2hs.subscribed"));
      setMode("hidden");
    } catch {
      toast.error(t("a2hs.blocked"));
    } finally {
      setSubscribing(false);
    }
  }

  if (mode === "hidden") return null;

  if (mode === "subscribe") {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full club-tint-bg flex items-center justify-center">
          <Bell className="w-5 h-5 club-primary" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {t("a2hs.subscribeTitle")}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {t("a2hs.subscribeTagline")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={subscribing}
          className="shrink-0 text-xs font-semibold club-primary hover:opacity-70 transition-opacity px-2 py-1 disabled:opacity-50"
        >
          {subscribing ? t("a2hs.subscribing") : t("a2hs.subscribe")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("a2hs.dismiss")}
          className="shrink-0 -mr-1 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // mode === "install"
  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full club-tint-bg flex items-center justify-center">
          <Share className="w-5 h-5 club-primary" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{t("a2hs.title")}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {t("a2hs.tagline")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 text-xs font-semibold club-primary hover:opacity-70 transition-opacity px-2 py-1"
        >
          {t("a2hs.showMe")}
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("a2hs.dismiss")}
          className="shrink-0 -mr-1 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <AddToHomescreenModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
