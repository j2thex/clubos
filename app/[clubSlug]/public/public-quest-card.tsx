"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/provider";
import { localized } from "@/lib/i18n";
import { toast } from "sonner";

interface Quest {
  id: string;
  title: string;
  description: string | null;
  title_es: string | null;
  description_es: string | null;
  image_url: string | null;
  link: string | null;
  reward_spins: number;
}

export function PublicQuestCard({ quest, clubSlug }: { quest: Quest; clubSlug: string }) {
  const { locale } = useLanguage();

  function handleCheck(e: React.MouseEvent) {
    e.preventDefault();
    toast(
      localized("Log in to complete quests!", "¡Inicia sesión para completar misiones!", locale),
      {
        action: {
          label: localized("Log in", "Iniciar sesión", locale),
          onClick: () => { window.location.href = `/${clubSlug}/login`; },
        },
      }
    );
  }

  const q = quest;
  const isEmail = q.link ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.link) : false;
  const href = q.link
    ? isEmail
      ? `mailto:${q.link}`
      : q.link.match(/^https?:\/\//) ? q.link : `https://${q.link}`
    : null;
  const display = q.link
    ? isEmail
      ? q.link
      : q.link.replace(/^https?:\/\//, "").replace(/\/$/, "")
    : null;

  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <div className="flex items-center gap-4">
        {/* Clickable checkbox circle */}
        <button
          onClick={handleCheck}
          className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center shrink-0 hover:border-[var(--club-primary,#16a34a)] hover:bg-[var(--club-primary,#16a34a)]/10 transition-colors cursor-pointer"
          aria-label={localized("Complete quest", "Completar misión", locale)}
        >
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{localized(q.title, q.title_es, locale)}</p>
          {q.description && (
            <p className="text-xs text-gray-400">{localized(q.description, q.description_es, locale)}</p>
          )}
          {q.link && href && display && (
            <a
              href={href}
              target={isEmail ? undefined : "_blank"}
              rel={isEmail ? undefined : "noopener noreferrer"}
              className="inline-block mt-1 text-xs font-medium club-primary underline truncate max-w-[200px]"
            >
              {display.length > 40 ? `${display.slice(0, 37)}...` : display}
            </a>
          )}
        </div>
        {q.reward_spins > 0 && (
          <span className="shrink-0 text-xs club-tint-text font-medium px-2 py-0.5 club-tint-bg rounded-full">
            +{q.reward_spins} spin{q.reward_spins === 1 ? "" : "s"}
          </span>
        )}
      </div>
    </div>
  );
}
