"use client";

import { useState, useTransition } from "react";
import { updateNotificationSecret } from "./actions";

export function NotificationLightManager({
  clubId,
  clubSlug,
  currentSecret,
}: {
  clubId: string;
  clubSlug: string;
  currentSecret: string | null;
}) {
  const [secret, setSecret] = useState(currentSecret);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const notifyUrl = secret
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/notify/${clubId}?secret=${secret}`
    : null;

  function handleGenerate() {
    const newSecret = crypto.randomUUID();
    startTransition(async () => {
      const result = await updateNotificationSecret(clubId, newSecret, clubSlug);
      if ("ok" in result) {
        setSecret(newSecret);
      }
    });
  }

  function handleCopy() {
    if (notifyUrl) {
      navigator.clipboard.writeText(notifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-2">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 py-4 space-y-4">
          {!secret ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500 mb-3">
                Generate a secret to enable the notification light API for this club.
              </p>
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Generating..." : "Generate Secret"}
              </button>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Notification URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={notifyUrl ?? ""}
                    className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    {copied ? "Copied!" : "Copy URL"}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-gray-700">Setup instructions:</p>
                <ol className="text-xs text-gray-500 space-y-0.5 list-decimal list-inside">
                  <li>Copy the notification URL above</li>
                  <li>Power on your ESP32 notification light</li>
                  <li>Connect to the <strong>osocios-light</strong> WiFi network from your phone</li>
                  <li>Paste the URL into the setup form that appears</li>
                  <li>The light will turn on whenever members have pending requests</li>
                </ol>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {isPending ? "Regenerating..." : "Regenerate secret (invalidates current device)"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
