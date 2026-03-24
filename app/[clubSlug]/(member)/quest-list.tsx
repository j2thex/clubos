"use client";

import { useState, useTransition } from "react";
import { submitQuest } from "./quest-actions";
import { useLanguage } from "@/lib/i18n/provider";
import { localized, type Locale } from "@/lib/i18n";
import { DynamicIcon } from "@/components/dynamic-icon";

interface Quest {
  id: string;
  title: string;
  description: string | null;
  title_es: string | null;
  description_es: string | null;
  link: string | null;
  image_url: string | null;
  icon: string | null;
  reward_spins: number;
  multi_use: boolean;
  quest_type: string | null;
  proof_mode: string | null;
  proof_placeholder: string | null;
  tutorial_steps: string[] | null;
}

function TutorialSteps({ questId, steps }: { questId: string; steps: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(`quest-steps-${questId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  function toggle(index: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      try { localStorage.setItem(`quest-steps-${questId}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  const done = checked.size;
  const total = steps.length;

  return (
    <div className="pl-14 space-y-1.5">
      <div className="flex items-center gap-2">
        <p className="text-xs font-medium text-gray-500">{done}/{total} steps</p>
        {done === total && <span className="text-[10px] text-green-600 font-medium">✓ All done</span>}
      </div>
      <div className="space-y-1">
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => toggle(i)}
            className="flex items-start gap-2 w-full text-left group"
          >
            <div className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
              checked.has(i) ? "bg-green-500 border-green-500 text-white" : "border-gray-300 group-hover:border-gray-400"
            }`}>
              {checked.has(i) && (
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-xs transition-colors ${checked.has(i) ? "text-gray-300 line-through" : "text-gray-500"}`}>
              {step}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReferralShare({ clubSlug, memberCode, clubName }: { clubSlug: string; memberCode: string; clubName: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${clubSlug}/public?ref=${memberCode}`
    : `/${clubSlug}/public?ref=${memberCode}`;
  const shareText = `I invite you to ${clubName}! Say my ID: ${memberCode}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  return (
    <div className="pl-14 pr-4 pb-2 space-y-3">
      {/* Copiable link */}
      <div
        onClick={copyLink}
        className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors group"
      >
        <span className="text-xs text-gray-500 truncate flex-1 font-mono">{shareUrl}</span>
        <span className={`text-[10px] font-semibold shrink-0 transition-colors ${copied ? "text-green-600" : "text-gray-400 group-hover:text-gray-600"}`}>
          {copied ? "✓ Copied!" : "Copy"}
        </span>
      </div>

      {/* Social share buttons */}
      <div className="flex gap-2">
        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.609.609l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.39-1.59.5.5 0 00-.42-.058l-2.88.966.966-2.88a.5.5 0 00-.058-.42A9.94 9.94 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
          WhatsApp
        </a>

        {/* Telegram */}
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          Telegram
        </a>

        {/* Instagram (copy) */}
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-[#E1306C]/10 text-[#E1306C] hover:bg-[#E1306C]/20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          Instagram
        </button>

        {/* TikTok (copy) */}
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-gray-900/10 text-gray-700 hover:bg-gray-900/15 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.72a8.19 8.19 0 0 0 4.76 1.52V6.79a4.83 4.83 0 0 1-1-.1z"/></svg>
          TikTok
        </button>
      </div>
    </div>
  );
}

export function QuestList({
  quests,
  completionCounts,
  pendingQuestIds,
  memberId,
  memberCode,
  clubName,
  clubSlug,
  locale,
}: {
  quests: Quest[];
  completionCounts: Record<string, number>;
  pendingQuestIds: string[];
  memberId: string;
  memberCode: string;
  clubName: string;
  clubSlug: string;
  locale: Locale;
}) {
  const [isPending, startTransition] = useTransition();
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const pendingSet = new Set(pendingQuestIds);
  const { t } = useLanguage();

  const [copiedToast, setCopiedToast] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  // Sort: pending first, then incomplete, then completed at bottom
  // Within each group, preserve original display_order
  const sortedQuests = [...quests].sort((a, b) => {
    const aCount = completionCounts[a.id] ?? 0;
    const bCount = completionCounts[b.id] ?? 0;
    const aDone = aCount > 0 && !a.multi_use;
    const bDone = bCount > 0 && !b.multi_use;
    const aPending = pendingSet.has(a.id);
    const bPending = pendingSet.has(b.id);

    // Priority: pending (0) > incomplete (1) > completed (2)
    const aRank = aPending ? 0 : aDone ? 2 : 1;
    const bRank = bPending ? 0 : bDone ? 2 : 1;
    return aRank - bRank;
  });

  const hasCompletedQuests = quests.some((q) => {
    const count = completionCounts[q.id] ?? 0;
    return count > 0 && !q.multi_use;
  });

  const filteredQuests = hideCompleted
    ? sortedQuests.filter((q) => {
        const count = completionCounts[q.id] ?? 0;
        return !(count > 0 && !q.multi_use);
      })
    : sortedQuests;

  function handleMarkDone(quest: Quest) {
    const mode = quest.proof_mode ?? "none";
    const qType = quest.quest_type ?? "default";
    // Feedback quests always expand for text input
    if (qType === "feedback" || (mode !== "none" && qType !== "tutorial")) {
      setExpandedId(quest.id);
    } else {
      // No proof needed — submit immediately
      startTransition(async () => {
        await submitQuest(memberId, quest.id, clubSlug);
      });
    }
  }

  function handleSubmit(quest: Quest) {
    const proof = proofUrls[quest.id]?.trim();
    const qType = quest.quest_type ?? "default";
    // Feedback requires text; default respects proof_mode
    if ((qType === "feedback" || quest.proof_mode === "required") && !proof) return;
    startTransition(async () => {
      await submitQuest(memberId, quest.id, clubSlug, proof || undefined);
      setProofUrls((prev) => { const next = { ...prev }; delete next[quest.id]; return next; });
      setExpandedId(null);
    });
  }

  function renderIcon(quest: Quest, done: boolean, isPendingQuest: boolean) {
    if (quest.image_url) {
      return <img src={quest.image_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />;
    }

    const qType = quest.quest_type ?? "default";
    const baseClass = `w-10 h-10 rounded-full flex items-center justify-center shrink-0`;
    const colorClass = done ? "club-tint-bg club-primary" : isPendingQuest ? "bg-yellow-50 text-yellow-500" : "bg-gray-100 text-gray-300";

    // Use custom icon if set by admin
    if (quest.icon) {
      return (
        <div className={`${baseClass} ${colorClass}`}>
          <DynamicIcon name={quest.icon} className="w-5 h-5" />
        </div>
      );
    }

    if (qType === "feedback") {
      return (
        <div className={`${baseClass} ${colorClass}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
      );
    }

    if (qType === "tutorial") {
      return (
        <div className={`${baseClass} ${colorClass}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      );
    }

    if (qType === "referral") {
      return (
        <div className={`${baseClass} ${colorClass}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
      );
    }

    return (
      <div className={`${baseClass} ${colorClass}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={done ? "M5 13l4 4L19 7" : "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasCompletedQuests && (
        <button
          onClick={() => setHideCompleted((h) => !h)}
          className="flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white/80 transition-colors ml-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            {hideCompleted ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
            )}
          </svg>
          {hideCompleted ? t("quests.showCompleted") : t("quests.hideCompleted")}
        </button>
      )}
      {filteredQuests.map((q) => {
        const count = completionCounts[q.id] ?? 0;
        const done = count > 0;
        const isMultiUse = q.multi_use ?? false;
        const isPendingQuest = pendingSet.has(q.id);
        const qType = q.quest_type ?? "default";
        const isFeedback = qType === "feedback";
        const isTutorial = qType === "tutorial";

        return (
          <div key={q.id} className="bg-white rounded-2xl shadow p-4 space-y-2">
            <div className="flex items-center gap-4">
              {renderIcon(q, done, isPendingQuest)}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{localized(q.title, q.title_es, locale)}</p>
                {q.description && (
                  <p className="text-xs text-gray-400">{localized(q.description, q.description_es, locale)}</p>
                )}
                {q.link && (() => {
                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.link!);
                  const href = isEmail
                    ? `mailto:${q.link}`
                    : q.link!.match(/^https?:\/\//) ? q.link! : `https://${q.link}`;
                  const display = isEmail
                    ? q.link!
                    : q.link!.replace(/^https?:\/\//, "").replace(/\/$/, "");
                  return (
                    <a
                      href={href}
                      target={isEmail ? undefined : "_blank"}
                      rel={isEmail ? undefined : "noopener noreferrer"}
                      className="inline-block mt-1 text-xs font-medium club-primary underline truncate max-w-[200px]"
                    >
                      {display.length > 40 ? `${display.slice(0, 37)}...` : display}
                    </a>
                  );
                })()}
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                {/* Completion badges */}
                {done && !isMultiUse && qType !== "referral" && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                    {t("quest.done")}
                  </span>
                )}
                {isPendingQuest && (
                  <>
                    {isMultiUse && count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                        {t("quest.doneCount", { count })}
                      </span>
                    )}
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-600">
                      {t("quest.pending")}
                    </span>
                  </>
                )}

                {/* Referral quest — show done count (share UI renders below the card) */}
                {qType === "referral" && !isPendingQuest && count > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                    {isMultiUse ? t("quest.doneCount", { count }) : t("quest.done")}
                  </span>
                )}

                {/* Non-referral quests — mark done button */}
                {qType !== "referral" && !isPendingQuest && !(done && !isMultiUse) && (
                  <>
                    {isMultiUse && count > 0 && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full club-tint-bg club-tint-text">
                        {t("quest.doneCount", { count })}
                      </span>
                    )}
                    <button
                      onClick={() => handleMarkDone(q)}
                      disabled={isPending}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      {isFeedback ? t("quest.shareFeedback") : t("quest.markDone")}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Tutorial steps display */}
            {isTutorial && q.tutorial_steps && q.tutorial_steps.length > 0 && (
              <TutorialSteps questId={q.id} steps={q.tutorial_steps} />
            )}

            {/* Referral share UI */}
            {qType === "referral" && !isPendingQuest && (
              <ReferralShare clubSlug={clubSlug} memberCode={memberCode} clubName={clubName} />
            )}

            {/* Feedback textarea or proof input */}
            {expandedId === q.id && (
              <div className="flex gap-2">
                {isFeedback ? (
                  <textarea
                    value={proofUrls[q.id] ?? ""}
                    onChange={(e) => setProofUrls((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder={q.proof_placeholder || t("quest.feedbackPlaceholder")}
                    autoFocus
                    rows={3}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={proofUrls[q.id] ?? ""}
                    onChange={(e) => setProofUrls((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder={q.proof_placeholder || t("quest.proofPlaceholder")}
                    autoFocus
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 transition"
                  />
                )}
                <button
                  onClick={() => handleSubmit(q)}
                  disabled={isPending || ((isFeedback || q.proof_mode === "required") && !proofUrls[q.id]?.trim())}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors shrink-0 self-end"
                >
                  {isPending ? "..." : t("common.submit")}
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Copied toast */}
      {copiedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {t("quests.linkCopied")}
        </div>
      )}
    </div>
  );
}
