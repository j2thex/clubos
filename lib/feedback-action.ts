"use server";

import { getMemberFromCookie, getStaffFromCookie, getOwnerFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const TRELLO_FEEDBACK_LIST_ID = "69d3b192d12d727409f0953b";

type Category = "bug" | "idea" | "question";

export async function submitFeedback(
  text: string,
  category: Category,
  pageUrl: string,
): Promise<{ error: string } | { ok: true }> {
  if (!text.trim() || text.trim().length < 3) {
    return { error: "Feedback too short" };
  }

  try {
  // Detect user context from cookies
  let role = "visitor";
  let userId: string | null = null;
  let clubId: string | null = null;
  let userLabel = "Anonymous visitor";

  try {
    const owner = await getOwnerFromCookie();
    if (owner) {
      role = "admin";
      userId = owner.owner_id;
      clubId = owner.club_id;
    }
  } catch { /* no owner cookie */ }

  if (!userId) {
    try {
      const staff = await getStaffFromCookie();
      if (staff) {
        role = "staff";
        userId = staff.member_id;
        clubId = staff.club_id;
      }
    } catch { /* no staff cookie */ }
  }

  if (!userId) {
    try {
      const member = await getMemberFromCookie();
      if (member) {
        role = "member";
        userId = member.member_id;
        clubId = member.club_id;
      }
    } catch { /* no member cookie */ }
  }

  // Fetch display info if we have a user
  if (userId && clubId) {
    const supabase = createAdminClient();
    const [memberResult, clubResult] = await Promise.all([
      role === "admin"
        ? supabase.from("club_owners").select("email").eq("id", userId).single()
        : supabase.from("members").select("member_code").eq("id", userId).single(),
      supabase.from("clubs").select("name").eq("id", clubId).single(),
    ]);

    const clubName = clubResult.data?.name ?? "Unknown club";
    if (role === "admin") {
      userLabel = `${(memberResult.data as { email?: string })?.email ?? "admin"} @ ${clubName}`;
    } else {
      userLabel = `${(memberResult.data as { member_code?: string })?.member_code ?? "unknown"} @ ${clubName}`;
    }
  }

  const categoryEmoji = category === "bug" ? "🐛" : category === "idea" ? "💡" : "❓";
  const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
  const cardTitle = `${categoryEmoji} [${categoryLabel}] ${role} — ${userLabel}`;
  const cardDesc = [
    text.trim(),
    "",
    "---",
    `**Role:** ${role}`,
    `**User:** ${userLabel}`,
    `**Page:** ${pageUrl}`,
    `**Time:** ${new Date().toISOString()}`,
  ].join("\n");

  // Push to Trello
  const apiKey = process.env.TRELLO_API_KEY;
  const apiToken = process.env.TRELLO_TOKEN;

  if (!apiKey || !apiToken) {
    console.error("Missing env vars — key:", !!apiKey, "token:", !!apiToken);
    return { error: `Feedback service not configured (key: ${!!apiKey}, token: ${!!apiToken})` };
  }

  try {
    const res = await fetch("https://api.trello.com/1/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idList: TRELLO_FEEDBACK_LIST_ID,
        name: cardTitle,
        desc: cardDesc,
        pos: "top",
        key: apiKey,
        token: apiToken,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Trello API error:", res.status, body);
      return { error: `Trello error ${res.status}: ${body.slice(0, 100)}` };
    }

    return { ok: true };
  } catch (err) {
    console.error("Trello fetch error:", err);
    return { error: `Network error: ${String(err).slice(0, 100)}` };
  }

  } catch (outerErr) {
    console.error("Feedback action error:", outerErr);
    return { error: "Something went wrong" };
  }
}
