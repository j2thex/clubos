"use server";

import { getMemberFromCookie, getStaffFromCookie, getOwnerFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const TRELLO_FEEDBACK_LIST_ID = "69d3b192d12d727409f0953b";

export async function submitFeedback(
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const text = (formData.get("text") as string)?.trim();
  const category = (formData.get("category") as string) || "idea";
  const pageUrl = (formData.get("pageUrl") as string) || "";
  const screenshot = formData.get("screenshot") as File | null;

  if (!text || text.length < 3) {
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
      if (owner) { role = "admin"; userId = owner.owner_id; clubId = owner.club_id; }
    } catch { /* no owner cookie */ }

    if (!userId) {
      try {
        const staff = await getStaffFromCookie();
        if (staff) { role = "staff"; userId = staff.member_id; clubId = staff.club_id; }
      } catch { /* no staff cookie */ }
    }

    if (!userId) {
      try {
        const member = await getMemberFromCookie();
        if (member) { role = "member"; userId = member.member_id; clubId = member.club_id; }
      } catch { /* no member cookie */ }
    }

    // Fetch display info
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
    const cardTitle = `${categoryEmoji} ${text.slice(0, 200)}`;
    const cardDesc = [
      text,
      "",
      "---",
      `**Category:** ${category}`,
      `**Role:** ${role}`,
      `**User:** ${userLabel}`,
      `**Page:** ${pageUrl}`,
      `**Time:** ${new Date().toISOString()}`,
    ].join("\n");

    // Push to Trello
    const apiKey = process.env.TRELLO_API_KEY;
    const apiToken = process.env.TRELLO_TOKEN;

    if (!apiKey || !apiToken) {
      return { error: `Feedback service not configured` };
    }

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
      return { error: `Trello ${res.status}: ${body.slice(0, 100)}` };
    }

    const card = await res.json();

    // Attach screenshot directly to Trello card
    if (screenshot && screenshot.size > 0 && card?.id) {
      const attachForm = new FormData();
      attachForm.append("file", screenshot, screenshot.name);
      attachForm.append("key", apiKey);
      attachForm.append("token", apiToken);
      await fetch(`https://api.trello.com/1/cards/${card.id}/attachments`, {
        method: "POST",
        body: attachForm,
      });
    }

    return { ok: true };
  } catch (err) {
    console.error("Feedback action error:", err);
    return { error: "Something went wrong" };
  }
}
