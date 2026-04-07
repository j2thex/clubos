"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendCampaignEmail, generateUnsubscribeToken } from "@/lib/email";

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

/**
 * Build the segment query and return matching member IDs + emails
 */
async function querySegment(clubId: string, filters: SegmentFilters) {
  const supabase = createAdminClient();

  // Start with members who have email and haven't opted out
  let query = supabase
    .from("members")
    .select("id, email, full_name")
    .eq("club_id", clubId)
    .not("email", "is", null)
    .eq("email_opt_out", false)
    .eq("is_system_member", false);

  // Status filter
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  // Expiring within N days
  if (filters.expiring_within_days && filters.expiring_within_days > 0) {
    const now = new Date();
    const future = new Date(now.getTime() + filters.expiring_within_days * 86400000);
    query = query
      .not("valid_till", "is", null)
      .gte("valid_till", now.toISOString().split("T")[0])
      .lte("valid_till", future.toISOString().split("T")[0]);
  }

  // Role filter
  if (filters.role_id) {
    query = query.eq("role_id", filters.role_id);
  }

  const { data: members } = await query;
  if (!members || members.length === 0) return [];

  let memberIds = new Set(members.map((m) => m.id));

  // Behavioral filters — further narrow the set
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

export async function sendCampaign(
  clubId: string,
  clubSlug: string,
  subject: string,
  bodyMarkdown: string,
  filters: SegmentFilters,
  ownerId: string | null,
): Promise<{ error: string } | { ok: true; sent: number; failed: number }> {
  if (!subject.trim() || !bodyMarkdown.trim()) {
    return { error: "Subject and body are required" };
  }

  const supabase = createAdminClient();

  // Get club branding
  const { data: club } = await supabase
    .from("clubs")
    .select("name, club_branding(logo_url, primary_color)")
    .eq("id", clubId)
    .single();

  if (!club) return { error: "Club not found" };

  const branding = Array.isArray(club.club_branding) ? club.club_branding[0] : club.club_branding;
  const clubName = club.name;
  const logoUrl = branding?.logo_url ?? null;
  const primaryColor = branding?.primary_color ?? "#16a34a";

  // Get recipients
  const recipients = await querySegment(clubId, filters);
  if (recipients.length === 0) {
    return { error: "No recipients match this segment" };
  }

  // Convert markdown to simple HTML (basic conversion)
  const bodyHtml = markdownToHtml(bodyMarkdown);

  // Send emails
  let sent = 0;
  let failed = 0;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://osocios.club";

  const results = await Promise.allSettled(
    recipients.map(async (member) => {
      const token = await generateUnsubscribeToken(member.id, clubId);
      const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${token}`;
      const result = await sendCampaignEmail(
        member.email!,
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
    if (r.status === "fulfilled") sent++;
    else failed++;
  }

  // Store campaign record
  await supabase.from("email_campaigns").insert({
    club_id: clubId,
    subject,
    body_markdown: bodyMarkdown,
    segment_filters: filters as Record<string, unknown>,
    recipient_count: sent,
    sent_by: ownerId,
  });

  return { ok: true, sent, failed };
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

/** Simple markdown to HTML converter */
function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, '<h3 style="font-size: 16px; font-weight: 600; color: #111; margin: 16px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size: 18px; font-weight: 600; color: #111; margin: 16px 0 8px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size: 20px; font-weight: 600; color: #111; margin: 16px 0 8px;">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>')
    // Line breaks (double newline = paragraph)
    .replace(/\n\n/g, "</p><p>")
    // Single newlines = <br>
    .replace(/\n/g, "<br>");

  html = `<p>${html}</p>`;
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, "").replace(/<p><br><\/p>/g, "");

  return `<div style="font-size: 14px; color: #333; line-height: 1.6;">${html}</div>`;
}
