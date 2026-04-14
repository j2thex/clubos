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
    <div className="m-card p-4">
      <div className="flex items-center gap-4">
        {/* Clickable checkbox circle — round is fine, it's avatar-sized */}
        <button
          onClick={handleCheck}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-gray-300 transition-colors hover:border-[var(--club-primary,#16a34a)] hover:bg-[var(--club-primary,#16a34a)]/10"
          aria-label={localized("Complete quest", "Completar misión", locale)}
        >
          <svg
            className="h-5 w-5 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[color:var(--m-ink)]">
            {localized(q.title, q.title_es, locale)}
          </p>
          {q.description && (
            <p className="text-xs text-[color:var(--m-ink-muted)]">
              {localized(q.description, q.description_es, locale)}
            </p>
          )}
          {q.link && href && display && (
            <a
              href={href}
              target={isEmail ? undefined : "_blank"}
              rel={isEmail ? undefined : "noopener noreferrer"}
              className="club-primary mt-1 inline-block max-w-[200px] truncate text-xs font-medium underline"
            >
              {display.length > 40 ? `${display.slice(0, 37)}...` : display}
            </a>
          )}
        </div>
        {q.reward_spins > 0 && (
          <span className="club-tint-text club-tint-bg shrink-0 rounded-[var(--m-radius-xs)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
            +{q.reward_spins} SPIN{q.reward_spins === 1 ? "" : "S"}
          </span>
        )}
      </div>
    </div>
  );
}
