"use server";

import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getMemberFromCookie, getStaffFromCookie, getOwnerFromCookie } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const TRELLO_FEEDBACK_LIST_ID = "69d3be8d8dfac139e7641bf8";

export async function improveFeedback(
  formData: FormData,
): Promise<{ error: string } | { improved: string }> {
  const text = (formData.get("text") as string)?.trim();
  const category = (formData.get("category") as string) || "idea";
  const pageUrl = (formData.get("pageUrl") as string) || "";
  const locale = (formData.get("locale") as string) || "en";
  const instruction = ((formData.get("instruction") as string) || "").trim();
  const screenshot = formData.get("screenshot") as File | null;

  if (!text || text.length < 3) {
    return { error: "Too short to improve" };
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: "AI not configured (missing key)" };
  }

  const categoryLabel = category === "bug" ? "bug report" : category === "idea" ? "feature idea" : "question";
  const language = locale === "es" ? "Spanish" : "English";

  const system = `You rewrite rough user feedback into a clear, well-structured ${categoryLabel}.
Rules:
- Write in ${language}, matching the user's original language if they wrote in another.
- Keep the user's voice and intent — do not invent facts.
- Be concise: 2-4 short sentences or a short bulleted list. Max ~120 words.
- For bugs, prefer: what happened / what was expected (only if inferable).
- For ideas, prefer: what they want / why it matters (only if inferable).
- No preamble, no sign-off, no markdown headers. Just the rewritten text.`;

  const promptText = instruction
    ? `Page: ${pageUrl}\n\nFeedback to rewrite:\n${text}\n\nUser's instruction for this rewrite: ${instruction}`
    : `Page: ${pageUrl}\n\nOriginal feedback:\n${text}`;

  const userContent: Array<
    | { type: "text"; text: string }
    | { type: "image"; image: Uint8Array; mediaType: string }
  > = [
    {
      type: "text",
      text: promptText,
    },
  ];

  // Anthropic only accepts these four image types. iOS HEIC, BMP, TIFF, etc.
  // would 400 the API; skip the image in that case (AI improves text only).
  const ANTHROPIC_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (screenshot && screenshot.size > 0 && ANTHROPIC_IMAGE_TYPES.includes(screenshot.type)) {
    const bytes = new Uint8Array(await screenshot.arrayBuffer());
    userContent.push({ type: "image", image: bytes, mediaType: screenshot.type });
  }

  try {
    const { text: improved } = await generateText({
      model: anthropic("claude-opus-4-5"),
      system,
      messages: [{ role: "user", content: userContent }],
    });
    const trimmed = improved.trim();
    if (!trimmed) return { error: "Empty AI response" };
    return { improved: trimmed };
  } catch (err) {
    console.error("improveFeedback error:", err);
    const msg = err instanceof Error ? err.message : "unknown";
    return { error: `AI improvement failed: ${msg.slice(0, 140)}` };
  }
}

async function generateFeedbackTitle(
  text: string,
  category: "bug" | "idea" | "question",
  locale: "en" | "es",
): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  const categoryLabel = category === "bug" ? "bug report" : category === "idea" ? "feature idea" : "question";
  const language = locale === "es" ? "Spanish" : "English";
  const system = `Summarize a ${categoryLabel} into at most 6 words in ${language}. No emoji, no quotes, no trailing punctuation. Keep the user's intent. Output only the title — no preamble, no explanation.`;

  try {
    const result = await Promise.race([
      generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        system,
        messages: [{ role: "user", content: text }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("title-timeout")), 3000),
      ),
    ]);
    let title = result.text.trim().replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, "").replace(/[.!?,;:]+$/g, "").trim();
    title = title.split(/\s+/).slice(0, 6).join(" ");
    return title.length > 0 ? title : null;
  } catch (err) {
    console.error("generateFeedbackTitle error:", err);
    return null;
  }
}

export async function submitFeedback(
  formData: FormData,
): Promise<{ error: string } | { ok: true }> {
  const text = (formData.get("text") as string)?.trim();
  const category = (formData.get("category") as string) || "idea";
  const pageUrl = (formData.get("pageUrl") as string) || "";
  const locale = (formData.get("locale") as string) === "es" ? "es" : "en";
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
    const aiTitle = await generateFeedbackTitle(text, category as "bug" | "idea" | "question", locale);
    const titleBody = aiTitle ?? text.slice(0, 60);
    const cardTitle = `${categoryEmoji} ${titleBody}`;
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
