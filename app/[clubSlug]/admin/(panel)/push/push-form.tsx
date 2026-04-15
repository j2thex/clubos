"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendTestPush } from "./actions";

type EventOption = { id: string; title: string; date: string };

export function PushForm({
  clubSlug,
  events,
}: {
  clubSlug: string;
  events: EventOption[];
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await sendTestPush({ clubSlug, title, body, url });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const { sent, removed, failed } = result;
      if (sent === 0 && failed === 0 && removed === 0) {
        toast.info("No subscribed members yet");
        return;
      }
      const parts: string[] = [];
      parts.push(`Sent to ${sent} device${sent === 1 ? "" : "s"}`);
      if (failed > 0) parts.push(`${failed} failed`);
      if (removed > 0) parts.push(`cleaned up ${removed} stale`);
      const message = parts.join(", ");
      if (failed > 0 && sent === 0) {
        toast.error(message);
      } else {
        toast.success(message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-lg">
      <div>
        <label htmlFor="push-title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          id="push-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="New event this Saturday"
        />
        <p className="mt-1 text-xs text-gray-500">{title.length}/80</p>
      </div>

      <div>
        <label htmlFor="push-body" className="block text-sm font-medium text-gray-700 mb-1">
          Body
        </label>
        <textarea
          id="push-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={300}
          required
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="Doors at 9pm. Free entry for members."
        />
        <p className="mt-1 text-xs text-gray-500">{body.length}/300</p>
      </div>

      <div>
        <label htmlFor="push-url" className="block text-sm font-medium text-gray-700 mb-1">
          Link (optional — path on this site)
        </label>
        <select
          id="push-url-picker"
          value=""
          onChange={(e) => {
            if (e.target.value) setUrl(e.target.value);
          }}
          className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
        >
          <option value="">Quick links…</option>
          <option value="/">Member home</option>
          <option value="/events">Events list</option>
          <option value="/offers">Offers list</option>
          {events.length > 0 && (
            <optgroup label="Upcoming events">
              {events.map((ev) => (
                <option key={ev.id} value={`/events/${ev.id}`}>
                  {ev.title} — {ev.date}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        <input
          id="push-url"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={500}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900"
          placeholder="/events/123"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send test notification"}
      </button>
    </form>
  );
}
