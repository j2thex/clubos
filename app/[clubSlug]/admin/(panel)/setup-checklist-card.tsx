"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = {
  key: string;
  label: string;
  ctaLabel: string;
  href: string;
  done: boolean;
};

const storageKey = (clubId: string) => `clubos-setup-dismissed:${clubId}`;

type ClientState = { hydrated: false } | { hydrated: true; dismissed: boolean };

export function SetupChecklistCard({
  clubId,
  title,
  subtitle,
  dismissLabel,
  items,
}: {
  clubId: string;
  title: string;
  subtitle: string;
  dismissLabel: string;
  items: Item[];
}) {
  const [state, setState] = useState<ClientState>({ hydrated: false });

  useEffect(() => {
    setState({
      hydrated: true,
      dismissed: window.localStorage.getItem(storageKey(clubId)) === "1",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state.hydrated) return null;
  if (state.dismissed) return null;

  const doneCount = items.filter((i) => i.done).length;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(storageKey(clubId), "1");
            setState({ hydrated: true, dismissed: true });
          }}
          className="text-xs text-gray-500 hover:text-gray-800"
        >
          {dismissLabel}
        </button>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="mt-5 space-y-2.5">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  item.done
                    ? "bg-green-600 text-white"
                    : "bg-white border border-gray-300 text-gray-400"
                }`}
              >
                {item.done ? "✓" : ""}
              </span>
              <span
                className={`text-sm truncate ${
                  item.done ? "text-gray-400 line-through" : "text-gray-800"
                }`}
              >
                {item.label}
              </span>
            </div>
            {!item.done &&
              (item.href.startsWith("#") ? (
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById(item.href.slice(1))
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="shrink-0 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                >
                  {item.ctaLabel}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className="shrink-0 rounded-md bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                >
                  {item.ctaLabel}
                </Link>
              ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
