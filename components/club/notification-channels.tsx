"use client";

import { useState, useTransition } from "react";
import { disconnectTelegramSubscription } from "@/app/[clubSlug]/(member)/notification-actions";

type Props = {
  clubSlug: string;
  memberCode: string;
  telegram: {
    enabled: boolean;
    botUsername: string | null;
    connected: boolean;
  };
  push: {
    supported: boolean;
    subscribed: boolean;
  };
};

export function NotificationChannels({
  clubSlug,
  memberCode,
  telegram,
  push,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [tgConnected, setTgConnected] = useState(telegram.connected);
  const [error, setError] = useState<string | null>(null);

  const deepLink =
    telegram.enabled && telegram.botUsername
      ? `https://t.me/${telegram.botUsername}?start=${encodeURIComponent(memberCode)}`
      : null;

  function handleDisconnectTelegram() {
    setError(null);
    startTransition(async () => {
      const res = await disconnectTelegramSubscription({ clubSlug });
      if (res.ok) {
        setTgConnected(false);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="m-card overflow-hidden">
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Push */}
      <Row
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        }
        title="Push notifications"
        subtitle={
          push.supported
            ? push.subscribed
              ? "Subscribed on this device"
              : "Tap the install banner on the dashboard to enable"
            : "Not supported on this browser"
        }
        status={push.subscribed ? "on" : "off"}
        action={null}
      />

      {/* Telegram */}
      <Row
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.13-.05-.18s-.14-.04-.21-.02c-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
        }
        title="Telegram"
        subtitle={
          !telegram.enabled
            ? "Not yet enabled by this club"
            : tgConnected
              ? "Connected — you'll receive updates here"
              : "Connect to receive updates in Telegram"
        }
        status={!telegram.enabled ? "disabled" : tgConnected ? "on" : "off"}
        action={
          !telegram.enabled ? null : tgConnected ? (
            <button
              type="button"
              onClick={handleDisconnectTelegram}
              disabled={isPending}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Disconnect
            </button>
          ) : deepLink ? (
            <a
              href={deepLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#229ED9] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1c8bbf]"
            >
              Connect
            </a>
          ) : null
        }
      />

      {/* WhatsApp — placeholder for v2 */}
      <Row
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 opacity-40"
          >
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.247-.694.247-1.289.173-1.413z" />
          </svg>
        }
        title="WhatsApp"
        subtitle="Coming soon"
        status="disabled"
        action={null}
      />
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  status,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  status: "on" | "off" | "disabled";
  action: React.ReactNode;
}) {
  const dotClass =
    status === "on"
      ? "bg-green-500"
      : status === "disabled"
        ? "bg-gray-200"
        : "bg-gray-300";
  return (
    <div className="flex items-center gap-3 px-4 py-3 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-[color:var(--m-border)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--m-surface-sunken)] text-[color:var(--m-ink)]">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[color:var(--m-ink)]">{title}</p>
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
        </div>
        <p className="truncate text-xs text-[color:var(--m-ink-muted)]">{subtitle}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
