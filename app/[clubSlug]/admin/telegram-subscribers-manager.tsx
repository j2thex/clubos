"use client";

import { useState, useTransition } from "react";
import {
  saveTelegramBotToken,
  verifyAndRegisterBot,
  disableMemberSubscriptions,
  sendTelegramTestBroadcast,
} from "./telegram-subscriptions-actions";

type Props = {
  clubSlug: string;
  initialToken: string | null;
  initialUsername: string | null;
  initialEnabled: boolean;
  subscriberCount: number;
};

export function TelegramSubscribersManager({
  clubSlug,
  initialToken,
  initialUsername,
  initialEnabled,
  subscriberCount,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [token, setToken] = useState(initialToken ?? "");
  const [username, setUsername] = useState(initialUsername);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [testBody, setTestBody] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasToken = !!initialToken;
  const deepLink = username ? `https://t.me/${username}?start=YOURCODE` : null;

  function flash(msg: string, kind: "success" | "error") {
    if (kind === "success") {
      setSuccess(msg);
      setError(null);
    } else {
      setError(msg);
      setSuccess(null);
    }
    setTimeout(() => {
      setSuccess(null);
      setError(null);
    }, 6000);
  }

  function handleSaveToken() {
    startTransition(async () => {
      const res = await saveTelegramBotToken({ clubSlug, token });
      if (res.ok) flash("Token saved. Click “Verify & enable” next.", "success");
      else flash(res.error, "error");
    });
  }

  function handleVerifyAndRegister() {
    startTransition(async () => {
      const res = await verifyAndRegisterBot({ clubSlug });
      if (res.ok) {
        setUsername(res.username);
        setEnabled(true);
        flash(`Bot @${res.username} verified and webhook registered.`, "success");
      } else {
        flash(res.error, "error");
      }
    });
  }

  function handleDisable() {
    startTransition(async () => {
      const res = await disableMemberSubscriptions({ clubSlug });
      if (res.ok) {
        setEnabled(false);
        flash("Member subscriptions disabled.", "success");
      } else {
        flash(res.error, "error");
      }
    });
  }

  function handleSendTest() {
    startTransition(async () => {
      const res = await sendTelegramTestBroadcast({ clubSlug, body: testBody });
      if (res.ok) {
        const lost = res.removed > 0 ? `, ${res.removed} stale removed` : "";
        const failed = res.failed > 0 ? `, ${res.failed} failed` : "";
        flash(`Sent to ${res.sent} subscribers${lost}${failed}.`, "success");
        setTestBody("");
      } else {
        flash(res.error, "error");
      }
    });
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-2.5">
          <span className="text-sm font-medium text-green-700">{success}</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5">
          <span className="text-sm font-medium text-red-700">{error}</span>
        </div>
      )}

      {/* Step 1: Bot token */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Step 1 — Bot token
          </p>
          {hasToken && (
            <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Saved
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Create a bot via{" "}
          <a
            href="https://t.me/BotFather"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 underline"
          >
            @BotFather
          </a>{" "}
          (send <code>/newbot</code>), then paste the token below.
        </p>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="123456789:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
        />
        <button
          type="button"
          onClick={handleSaveToken}
          disabled={isPending || !token.trim()}
          className="mt-3 rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
        >
          Save token
        </button>
      </div>

      {/* Step 2: Verify + register webhook */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Step 2 — Verify &amp; enable
          </p>
          {enabled && (
            <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Enabled
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Verifies the token, captures the bot username, and registers the
          webhook so members can <code>/start</code> the bot.
        </p>
        {username && (
          <p className="text-xs text-gray-700 mb-3">
            Bot:{" "}
            <a
              href={`https://t.me/${username}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-blue-600 underline"
            >
              @{username}
            </a>
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleVerifyAndRegister}
            disabled={isPending || !hasToken}
            className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
          >
            {enabled ? "Re-register webhook" : "Verify & enable"}
          </button>
          {enabled && (
            <button
              type="button"
              onClick={handleDisable}
              disabled={isPending}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Disable subscriptions
            </button>
          )}
        </div>
      </div>

      {/* Subscribers + test */}
      <div className="rounded-2xl bg-white shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Subscribers
          </p>
          <span className="text-sm font-semibold text-gray-900">
            {subscriberCount}
          </span>
        </div>
        {deepLink && (
          <p className="text-xs text-gray-500 mb-3">
            Members opt in by clicking{" "}
            <span className="font-mono">Connect Telegram</span> in their
            profile, which opens the deep-link to your bot. Pattern:{" "}
            <code className="text-[11px]">{deepLink}</code>
          </p>
        )}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Send test broadcast
          </p>
          <textarea
            rows={3}
            value={testBody}
            onChange={(e) => setTestBody(e.target.value)}
            placeholder="A short test message — fans out to all subscribers above."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none"
          />
          <button
            type="button"
            onClick={handleSendTest}
            disabled={
              isPending ||
              !enabled ||
              !testBody.trim() ||
              subscriberCount === 0
            }
            className="mt-2 rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50"
          >
            Send test
          </button>
        </div>
      </div>
    </div>
  );
}
