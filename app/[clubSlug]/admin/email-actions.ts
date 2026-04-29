"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendCampaignEmail, generateUnsubscribeToken } from "@/lib/email";
import { sendTelegramToSubscriptions } from "@/lib/telegram/send";
import { sendPushToMember } from "@/lib/push/send";

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

export type BroadcastChannel = "email" | "telegram" | "push";

type SegmentMember = {
  id: string;
  email: string | null;
  full_name: string;
};

/**
 * Resolve the segment to a list of matching members.
 *
 * `requireEmail` keeps the legacy email-only behavior (only members with an
 * email and no opt-out). Multi-channel sends pass `false` so Telegram / Push
 * recipients aren't filtered out for lacking an email.
 */
async function querySegment(
  clubId: string,
  filters: SegmentFilters,
  requireEmail = true,
): Promise<SegmentMember[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from("members")
    .select("id, email, full_name")
    .eq("club_id", clubId)
    .eq("is_system_member", false);

  if (requireEmail) {
    query = query.not("email", "is", null).eq("email_opt_out", false);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.expiring_within_days && filters.expiring_within_days > 0) {
    const now = new Date();
    const future = new Date(now.getTime() + filters.expiring_within_days * 86400000);
    query = query
      .not("valid_till", "is", null)
      .gte("valid_till", now.toISOString().split("T")[0])
      .lte("valid_till", future.toISOString().split("T")[0]);
  }

  if (filters.role_id) {
    query = query.eq("role_id", filters.role_id);
  }

  const { data: members } = await query;
  if (!members || members.length === 0) return [];

  let memberIds = new Set(members.map((m) => m.id));

  if (filters.quest_completed) {
    const { data } = await supabase
      .from("member_quests")
      .select("member_id")
      .eq("quest_id", filters.quest_completed)
      .neq("status", "pending");
    const ids = new Set((data ?? []).map((r) => r.member_id));
    memberIds = new Set([...memberIds].filter((id) => ids.has(id)));
  }

  if (filters.has_completed_any_quest) {
    const { data } = await supabase
      .from("member_quests")
      .select("member_id, quests!inner(club_id)")
      .eq("quests.club_id", clubId)
      .neq("status", "pending");
    const ids = new Set((data ?? []).map((r) => r.member_id));
    memberIds = new Set([...memberIds].filter((id) => ids.has(id)));
  }

  if (filters.event_attended) {
    const { data } = await supabase
      .from("event_checkins")
      .select("member_id")
      .eq("event_id", filters.event_attended);
    const ids = new Set((data ?? []).map((r) => r.member_id));
    memberIds = new Set([...memberIds].filter((id) => ids.has(id)));
  }

  if (filters.offer_requested) {
    const { data } = await supabase
      .from("offer_orders")
      .select("member_id")
      .eq("offer_id", filters.offer_requested);
    const ids = new Set((data ?? []).map((r) => r.member_id));
    memberIds = new Set([...memberIds].filter((id) => ids.has(id)));
  }

  if (filters.has_spun) {
    const { data } = await supabase
      .from("spins")
      .select("member_id")
      .eq("club_id", clubId);
    const ids = new Set((data ?? []).map((r) => r.member_id));
    memberIds = new Set([...memberIds].filter((id) => ids.has(id)));
  }

  return members.filter((m) => memberIds.has(m.id));
}

export async function countRecipients(
  clubId: string,
  filters: SegmentFilters,
): Promise<number> {
  const members = await querySegment(clubId, filters);
  return members.length;
}

export async function countSegment(
  clubId: string,
  filters: SegmentFilters,
): Promise<{ total: number; emailable: number }> {
  const all = await querySegment(clubId, filters, false);
  const emailable = await querySegment(clubId, filters, true);
  return { total: all.length, emailable: emailable.length };
}

export async function sendCampaign(
  clubId: string,
  clubSlug: string,
  subject: string,
  bodyMarkdown: string,
  filters: SegmentFilters,
  ownerId: string | null,
  channels: BroadcastChannel[] = ["email"],
): Promise<
  | { error: string }
  | {
      ok: true;
      counts: Record<BroadcastChannel, { sent: number; failed: number; recipients: number }>;
    }
> {
  if (!subject.trim() || !bodyMarkdown.trim()) {
    return { error: "Subject and body are required" };
  }
  if (channels.length === 0) {
    return { error: "Pick at least one channel" };
  }

  const supabase = createAdminClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("name, club_branding(logo_url, primary_color)")
    .eq("id", clubId)
    .single();
  if (!club) return { error: "Club not found" };

  const branding = Array.isArray(club.club_branding)
    ? club.club_branding[0]
    : club.club_branding;
  const clubName = club.name;
  const logoUrl = branding?.logo_url ?? null;
  const primaryColor = branding?.primary_color ?? "#16a34a";

  // Resolve the segment once. Email channel narrows further to email-eligible.
  const segmentMembers = await querySegment(clubId, filters, false);
  if (segmentMembers.length === 0) {
    return { error: "No recipients match this segment" };
  }
  const memberIds = segmentMembers.map((m) => m.id);

  const counts: Record<BroadcastChannel, { sent: number; failed: number; recipients: number }> = {
    email: { sent: 0, failed: 0, recipients: 0 },
    telegram: { sent: 0, failed: 0, recipients: 0 },
    push: { sent: 0, failed: 0, recipients: 0 },
  };

  // ---------- Email ----------
  if (channels.includes("email")) {
    const emailable = segmentMembers.filter(
      (m): m is SegmentMember & { email: string } => !!m.email,
    );
    counts.email.recipients = emailable.length;

    if (emailable.length > 0) {
      const bodyHtml = markdownToHtml(bodyMarkdown);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://osocios.club";

      const results = await Promise.allSettled(
        emailable.map(async (member) => {
          const token = await generateUnsubscribeToken(member.id, clubId);
          const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${token}`;
          const result = await sendCampaignEmail(
            member.email,
            subject,
            bodyHtml,
            clubName,
            logoUrl,
            primaryColor,
            unsubscribeUrl,
          );
          if ("error" in result) throw new Error(result.error);
        }),
      );
      for (const r of results) {
        if (r.status === "fulfilled") counts.email.sent++;
        else counts.email.failed++;
      }

      // Legacy single-channel record kept for the existing campaign history view.
      await supabase.from("email_campaigns").insert({
        club_id: clubId,
        subject,
        body_markdown: bodyMarkdown,
        segment_filters: filters as Record<string, unknown>,
        recipient_count: counts.email.sent,
        sent_by: ownerId,
      });
    }
  }

  // ---------- Telegram ----------
  if (channels.includes("telegram")) {
    const { data: tgRows } = await supabase
      .from("telegram_subscriptions")
      .select("member_id")
      .eq("club_id", clubId)
      .in("member_id", memberIds);
    counts.telegram.recipients = tgRows?.length ?? 0;
    if (counts.telegram.recipients > 0) {
      const tgResult = await sendTelegramToSubscriptions(clubId, memberIds, {
        title: subject,
        body: stripMarkdown(bodyMarkdown),
      });
      counts.telegram.sent = tgResult.sent;
      counts.telegram.failed = tgResult.failed;
    }
  }

  // ---------- Push ----------
  if (channels.includes("push")) {
    const { data: pushRows } = await supabase
      .from("push_subscriptions")
      .select("member_id")
      .eq("club_id", clubId)
      .in("member_id", memberIds);
    const pushMemberIds = Array.from(new Set((pushRows ?? []).map((r) => r.member_id)));
    counts.push.recipients = pushMemberIds.length;
    if (pushMemberIds.length > 0) {
      const pushResults = await Promise.all(
        pushMemberIds.map((memberId) =>
          sendPushToMember(memberId, {
            title: subject,
            body: stripMarkdown(bodyMarkdown),
          }),
        ),
      );
      for (const r of pushResults) {
        counts.push.sent += r.sent;
        counts.push.failed += r.failed;
      }
    }
  }

  // ---------- Audit row ----------
  const recipient_counts: Record<string, number> = {};
  const sent_counts: Record<string, number> = {};
  const failed_counts: Record<string, number> = {};
  for (const ch of channels) {
    recipient_counts[ch] = counts[ch].recipients;
    sent_counts[ch] = counts[ch].sent;
    failed_counts[ch] = counts[ch].failed;
  }

  await supabase.from("notification_broadcasts").insert({
    club_id: clubId,
    sent_by: ownerId,
    channels,
    segment: filters as Record<string, unknown>,
    title: subject,
    body: bodyMarkdown,
    recipient_counts,
    sent_counts,
    failed_counts,
  });

  return { ok: true, counts };
}

export async function getCampaignHistory(clubId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("email_campaigns")
    .select("id, subject, recipient_count, segment_filters, sent_at")
    .eq("club_id", clubId)
    .order("sent_at", { ascending: false })
    .limit(20);

  return data ?? [];
}

export async function getEmailStats(clubId: string) {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("members")
    .select("id", { count: "exact", head: true })
    .eq("club_id", clubId)
    .not("email", "is", null)
    .eq("email_opt_out", false)
    .eq("is_system_member", false);

  return count ?? 0;
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.+)$/gm, '<h3 style="font-size: 16px; font-weight: 600; color: #111; margin: 16px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size: 18px; font-weight: 600; color: #111; margin: 16px 0 8px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size: 20px; font-weight: 600; color: #111; margin: 16px 0 8px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  html = `<p>${html}</p>`;
  html = html.replace(/<p><\/p>/g, "").replace(/<p><br><\/p>/g, "");

  return `<div style="font-size: 14px; color: #333; line-height: 1.6;">${html}</div>`;
}

// Telegram + Push payloads are plain text. Strip markdown formatting so
// asterisks/brackets don't bleed into chat / notifications.
function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6} +/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)");
}
