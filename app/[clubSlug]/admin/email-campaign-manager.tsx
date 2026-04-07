"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { countRecipients, sendCampaign, getCampaignHistory } from "./email-actions";
import { useLanguage } from "@/lib/i18n/provider";

interface Role {
  id: string;
  name: string;
}

interface QuestOption {
  id: string;
  title: string;
}

interface EventOption {
  id: string;
  title: string;
}

interface OfferOption {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  subject: string;
  recipient_count: number;
  segment_filters: Record<string, unknown>;
  sent_at: string;
}

interface SegmentFilters {
  status?: "active" | "inactive";
  expiring_within_days?: number;
  role_id?: string;
  quest_completed?: string;
  has_completed_any_quest?: boolean;
  event_attended?: string;
  offer_requested?: string;
  has_spun?: boolean;
}

export function EmailCampaignManager({
  clubId,
  clubSlug,
  emailCount,
  roles,
  quests,
  events,
  offers,
  campaigns: initialCampaigns,
  ownerId,
}: {
  clubId: string;
  clubSlug: string;
  emailCount: number;
  roles: Role[];
  quests: QuestOption[];
  events: EventOption[];
  offers: OfferOption[];
  campaigns: Campaign[];
  ownerId: string | null;
}) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();

  // Composer state
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Segment state
  const [filters, setFilters] = useState<SegmentFilters>({});
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);

  // UI state
  const [confirmSend, setConfirmSend] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState(initialCampaigns);

  // Debounced recipient count
  const fetchCount = useCallback(() => {
    setCountLoading(true);
    countRecipients(clubId, filters).then((count) => {
      setRecipientCount(count);
      setCountLoading(false);
    });
  }, [clubId, filters]);

  useEffect(() => {
    const timer = setTimeout(fetchCount, 500);
    return () => clearTimeout(timer);
  }, [fetchCount]);

  function updateFilter<K extends keyof SegmentFilters>(key: K, value: SegmentFilters[K] | undefined) {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === "" || value === false) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }

  function handleSend() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await sendCampaign(clubId, clubSlug, subject, body, filters, ownerId);
      if ("error" in result) {
        setError(result.error);
      } else {
        if (result.failed > 0) {
          setSuccess(t("admin.emailSentFailed", { sent: result.sent, failed: result.failed }));
        } else {
          setSuccess(t("admin.emailSent", { count: result.sent }));
        }
        setSubject("");
        setBody("");
        setConfirmSend(false);
        // Refresh history
        getCampaignHistory(clubId).then(setCampaigns);
      }
      setTimeout(() => { setSuccess(null); setError(null); }, 8000);
    });
  }

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-4">
      {/* Email count banner */}
      <div className="px-1">
        <p className="text-xs text-gray-500">
          {t("admin.emailMembersWithEmail", { count: emailCount })}
        </p>
      </div>

      {/* Feedback messages */}
      {success && (
        <div className="px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium text-green-700">{success}</span>
        </div>
      )}
      {error && (
        <div className="px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl">
          <span className="text-sm font-medium text-red-700">{error}</span>
        </div>
      )}

      {/* Composer */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("admin.emailCampaigns")}</p>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.emailSubject")}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("admin.emailSubjectPlaceholder")}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-gray-500">{t("admin.emailBody")}</label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPreview ? "Edit" : t("admin.emailPreview")}
              </button>
            </div>
            {showPreview ? (
              <div
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 min-h-[120px] prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: simpleMarkdownPreview(body) }}
              />
            ) : (
              <textarea
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("admin.emailBodyPlaceholder")}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none font-mono"
              />
            )}
          </div>

          {/* Segment Picker */}
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("admin.segmentAll")}</p>

            <div className="grid grid-cols-2 gap-3">
              {/* Status */}
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">{t("admin.segmentStatus")}</label>
                <select
                  value={filters.status ?? ""}
                  onChange={(e) => updateFilter("status", e.target.value as "active" | "inactive" | undefined || undefined)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="">{t("admin.segmentStatusAll")}</option>
                  <option value="active">{t("admin.segmentStatusActive")}</option>
                  <option value="inactive">{t("admin.segmentStatusInactive")}</option>
                </select>
              </div>

              {/* Expiring */}
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">{t("admin.segmentExpiring")}</label>
                <input
                  type="number"
                  min="0"
                  value={filters.expiring_within_days ?? ""}
                  onChange={(e) => updateFilter("expiring_within_days", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="—"
                  className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>

              {/* Role */}
              {roles.length > 0 && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">{t("admin.segmentRole")}</label>
                  <select
                    value={filters.role_id ?? ""}
                    onChange={(e) => updateFilter("role_id", e.target.value || undefined)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <option value="">{t("admin.segmentAnyRole")}</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quest completed */}
              {quests.length > 0 && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">{t("admin.segmentQuest")}</label>
                  <select
                    value={filters.quest_completed ?? ""}
                    onChange={(e) => updateFilter("quest_completed", e.target.value || undefined)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <option value="">{t("admin.segmentAnyQuest")}</option>
                    {quests.map((q) => (
                      <option key={q.id} value={q.id}>{q.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Event attended */}
              {events.length > 0 && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">{t("admin.segmentEvent")}</label>
                  <select
                    value={filters.event_attended ?? ""}
                    onChange={(e) => updateFilter("event_attended", e.target.value || undefined)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <option value="">{t("admin.segmentAnyEvent")}</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Offer requested */}
              {offers.length > 0 && (
                <div>
                  <label className="block text-[10px] font-medium text-gray-400 mb-1">{t("admin.segmentOffer")}</label>
                  <select
                    value={filters.offer_requested ?? ""}
                    onChange={(e) => updateFilter("offer_requested", e.target.value || undefined)}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <option value="">{t("admin.segmentAnyOffer")}</option>
                    {offers.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Has spun toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!filters.has_spun}
                onChange={(e) => updateFilter("has_spun", e.target.checked || undefined)}
                className="rounded border-gray-300"
              />
              <span className="text-xs text-gray-600">{t("admin.segmentHasSpun")}</span>
            </label>

            {/* Recipient count */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">
                {countLoading ? "..." : t("admin.segmentRecipients", { count: recipientCount ?? 0 })}
              </span>
            </div>
          </div>

          {/* Send button */}
          {!confirmSend ? (
            <button
              type="button"
              onClick={() => setConfirmSend(true)}
              disabled={isPending || !subject.trim() || !body.trim() || recipientCount === 0}
              className="w-full rounded-lg bg-gray-800 text-white py-2.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t("admin.emailSend")}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSend}
                disabled={isPending}
                className="flex-1 rounded-lg bg-green-600 text-white py-2.5 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? t("admin.emailSending") : t("admin.emailSendConfirm", { count: recipientCount ?? 0 })}
              </button>
              <button
                type="button"
                onClick={() => setConfirmSend(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Campaign History */}
      {campaigns.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("admin.emailHistory")}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {campaigns.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.subject}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.recipient_count} {c.recipient_count === 1 ? "recipient" : "recipients"} &middot; {timeAgo(c.sent_at)}
                  </p>
                </div>
                <div className="shrink-0 ml-3">
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    {new Date(c.sent_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Client-side markdown preview (simplified) */
function simpleMarkdownPreview(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}
