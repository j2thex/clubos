"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateDraft } from "@/lib/ai/generate-content";
import { generateImage } from "@/lib/ai/generate-image";
import { loadPrompt, renderTemplate } from "@/lib/ai/prompts";
import {
  questDraftSchema,
  eventDraftSchema,
  setupDraftSchema,
  type QuestDraft,
  type EventDraft,
  type SetupDraft,
} from "@/lib/ai/schemas";
import { getOwnerFromCookie } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Admin-side server actions for AI-assisted content drafting.
// Each function fetches club context, calls the AI module, and returns
// a typed draft that the client manager prefills into its form state.

async function loadClubContext(clubId: string): Promise<{
  name: string;
  description: string;
  primaryColor: string;
  socialInstagram: string;
  socialWhatsapp: string;
  socialTelegram: string;
  socialGoogleMaps: string;
  socialWebsite: string;
}> {
  const supabase = createAdminClient();
  const [{ data: club }, { data: branding }] = await Promise.all([
    supabase.from("clubs").select("name").eq("id", clubId).single(),
    supabase
      .from("club_branding")
      .select(
        "hero_content, primary_color, social_instagram, social_whatsapp, social_telegram, social_google_maps, social_website",
      )
      .eq("club_id", clubId)
      .maybeSingle(),
  ]);

  return {
    name: club?.name ?? "the club",
    description: branding?.hero_content ?? "",
    primaryColor: branding?.primary_color ?? "#16a34a",
    socialInstagram: branding?.social_instagram ?? "",
    socialWhatsapp: branding?.social_whatsapp ?? "",
    socialTelegram: branding?.social_telegram ?? "",
    socialGoogleMaps: branding?.social_google_maps ?? "",
    socialWebsite: branding?.social_website ?? "",
  };
}

async function assertOwner(clubId: string): Promise<string | null> {
  try {
    const owner = await getOwnerFromCookie();
    if (owner && owner.club_id === clubId) return owner.owner_id;
  } catch {
    /* no cookie */
  }
  return null;
}

export async function generateQuestDraftAction(
  clubId: string,
  userPrompt: string,
): Promise<{ error: string } | { ok: true; draft: QuestDraft }> {
  const trimmed = userPrompt.trim();
  if (trimmed.length < 3) return { error: "Describe the quest in at least a few words" };
  if (trimmed.length > 1000) return { error: "Description too long (max 1000 chars)" };

  const ownerId = await assertOwner(clubId);
  if (!ownerId) return { error: "Unauthorized" };

  try {
    const ctx = await loadClubContext(clubId);
    const result = await generateDraft({
      clubId,
      ownerId,
      contentType: "quest",
      schema: questDraftSchema,
      userPrompt: trimmed,
      templateVars: {
        club_name: ctx.name,
        club_description: ctx.description,
        primary_color: ctx.primaryColor,
        social_instagram: ctx.socialInstagram,
        social_whatsapp: ctx.socialWhatsapp,
        social_telegram: ctx.socialTelegram,
        social_google_maps: ctx.socialGoogleMaps,
        social_website: ctx.socialWebsite,
      },
    });
    return { ok: true, draft: result.draft };
  } catch (err) {
    console.error("[ai-actions] generateQuestDraftAction", clubId, err);
    const msg = err instanceof Error ? err.message : "unknown";
    return { error: `AI generation failed: ${cleanErrorMessage(msg)}` };
  }
}

function cleanErrorMessage(msg: string): string {
  // Strip URLs so we don't leak half a link to the user
  const urlless = msg.replace(/https?:\/\/\S+/g, "").trim();
  return urlless.slice(0, 220);
}

export async function generateQuestImageAction(
  clubId: string,
  title: string,
  description: string,
  styleHint?: string,
): Promise<{ error: string } | { ok: true; url: string }> {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 2) {
    return { error: "Fill in the quest title first" };
  }

  const ownerId = await assertOwner(clubId);
  if (!ownerId) return { error: "Unauthorized" };

  try {
    const ctx = await loadClubContext(clubId);
    const trimmedDesc = description.trim();
    const tower = await loadPrompt("quest_image");
    const prompt = renderTemplate(tower.user_template, {
      title: trimmedTitle,
      description: trimmedDesc ? ` — ${trimmedDesc}` : "",
      primary_color: ctx.primaryColor,
      style_hint: styleHint?.trim() ?? "",
    });

    const result = await generateImage({
      clubId,
      ownerId,
      contentType: "quest",
      prompt,
      // Nano Banana won't reliably emit a transparent alpha channel, so
      // the tower prompt tells it to use a solid white background and we
      // strip that white here before upload. Works for any badge shape.
      postProcess: "removeWhiteBg",
    });
    return { ok: true, url: result.url };
  } catch (err) {
    console.error("[ai-actions] generateQuestImageAction", clubId, err);
    const msg = err instanceof Error ? err.message : "unknown";
    return { error: `Image generation failed: ${cleanErrorMessage(msg)}` };
  }
}

// Returns the ISO date for the next Saturday (exclusive of today). Used
// as a sensible fallback when the AI proposes an event without a date.
function nextSaturdayIso(): string {
  const d = new Date();
  const daysUntilSat = (6 - d.getUTCDay() + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilSat);
  return d.toISOString().slice(0, 10);
}

export async function generateSetupDraftAction(
  clubId: string,
  userPrompt: string,
): Promise<{ error: string } | { ok: true; draft: SetupDraft }> {
  const trimmed = userPrompt.trim();
  if (trimmed.length < 10) return { error: "Describe your club in a couple of sentences at least" };
  if (trimmed.length > 2000) return { error: "Description too long (max 2000 chars)" };

  const ownerId = await assertOwner(clubId);
  if (!ownerId) return { error: "Unauthorized" };

  try {
    const ctx = await loadClubContext(clubId);
    const today = new Date().toISOString().slice(0, 10);
    const result = await generateDraft({
      clubId,
      ownerId,
      contentType: "setup_agent",
      schema: setupDraftSchema,
      userPrompt: trimmed,
      templateVars: {
        club_name: ctx.name,
        club_description: ctx.description,
        primary_color: ctx.primaryColor,
        current_date: today,
        social_instagram: ctx.socialInstagram,
        social_whatsapp: ctx.socialWhatsapp,
        social_telegram: ctx.socialTelegram,
        social_google_maps: ctx.socialGoogleMaps,
        social_website: ctx.socialWebsite,
      },
    });
    return { ok: true, draft: result.draft };
  } catch (err) {
    console.error("[ai-actions] generateSetupDraftAction", clubId, err);
    const msg = err instanceof Error ? err.message : "unknown";
    return { error: `Setup generation failed: ${cleanErrorMessage(msg)}` };
  }
}

export async function saveSetupDraftAction(
  clubId: string,
  clubSlug: string,
  draft: SetupDraft,
): Promise<{ error: string } | { ok: true; questCount: number; eventCount: number }> {
  const ownerId = await assertOwner(clubId);
  if (!ownerId) return { error: "Unauthorized" };

  // Re-parse with the schema so we never trust the wire payload blindly.
  const parsed = setupDraftSchema.safeParse(draft);
  if (!parsed.success) {
    return { error: "Invalid draft payload" };
  }
  const safe = parsed.data;

  const supabase = createAdminClient();

  // Compute next display_order bases so new items land after existing ones.
  const [{ data: lastQuest }, { data: lastEvent }] = await Promise.all([
    supabase
      .from("quests")
      .select("display_order")
      .eq("club_id", clubId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("events")
      .select("display_order")
      .eq("club_id", clubId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const questBase = (lastQuest?.display_order ?? -1) + 1;
  const eventBase = (lastEvent?.display_order ?? -1) + 1;

  // Bulk insert quests. No auto-badge creation here — keeps the wizard
  // simple; admin can toggle "Award badge" per-quest afterwards in the
  // quest manager. Tutorial steps are respected; everything else gets
  // mapped field-for-field from the Zod shape to the DB columns.
  if (safe.quests.length > 0) {
    const questRows = safe.quests.map((q, i) => ({
      club_id: clubId,
      title: q.title,
      title_es: q.title_es,
      description: q.description,
      description_es: q.description_es,
      link: q.link,
      icon: q.icon,
      reward_spins: q.reward_spins,
      category: q.category,
      quest_type: q.quest_type,
      proof_mode: q.proof_mode,
      multi_use: q.multi_use,
      tutorial_steps: q.tutorial_steps,
      is_public: false,
      active: true,
      display_order: questBase + i,
    }));
    const { error: qErr } = await supabase.from("quests").insert(questRows);
    if (qErr) return { error: `Failed to save quests: ${qErr.message}` };
  }

  // Bulk insert events. The AI sometimes returns date: null (it doesn't
  // know what "soon" means), so we fall back to next-Saturday as a
  // sensible placeholder — the admin can edit the date on the event
  // page after save. No event is silently dropped.
  if (safe.events.length > 0) {
    const fallbackDate = nextSaturdayIso();
    const eventRows = safe.events.map((e, i) => ({
      club_id: clubId,
      title: e.title,
      title_es: e.title_es,
      description: e.description,
      description_es: e.description_es,
      date: e.date ?? fallbackDate,
      time: e.time,
      end_time: e.end_time,
      price: e.price,
      icon: e.icon,
      link: e.link,
      location_name: e.location_name,
      is_public: false,
      active: true,
      display_order: eventBase + i,
    }));
    const { error: eErr } = await supabase.from("events").insert(eventRows);
    if (eErr) return { error: `Failed to save events: ${eErr.message}` };
  }

  revalidatePath(`/${clubSlug}/admin`, "layout");
  return {
    ok: true,
    questCount: safe.quests.length,
    eventCount: safe.events.length,
  };
}

export async function generateEventImageAction(
  clubId: string,
  title: string,
  description: string,
  styleHint?: string,
): Promise<{ error: string } | { ok: true; url: string }> {
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 2) {
    return { error: "Fill in the event title first" };
  }

  const ownerId = await assertOwner(clubId);
  if (!ownerId) return { error: "Unauthorized" };

  try {
    const ctx = await loadClubContext(clubId);
    const trimmedDesc = description.trim();
    const tower = await loadPrompt("event_image");
    const prompt = renderTemplate(tower.user_template, {
      title: trimmedTitle,
      description: trimmedDesc ? ` — ${trimmedDesc}` : "",
      primary_color: ctx.primaryColor,
      style_hint: styleHint?.trim() ?? "",
    });

    const result = await generateImage({
      clubId,
      ownerId,
      contentType: "event",
      prompt,
      bucket: "event",
    });
    return { ok: true, url: result.url };
  } catch (err) {
    console.error("[ai-actions] generateEventImageAction", clubId, err);
    const msg = err instanceof Error ? err.message : "unknown";
    return { error: `Image generation failed: ${cleanErrorMessage(msg)}` };
  }
}

export async function generateEventDraftAction(
  clubId: string,
  userPrompt: string,
): Promise<{ error: string } | { ok: true; draft: EventDraft }> {
  const trimmed = userPrompt.trim();
  if (trimmed.length < 3) return { error: "Describe the event in at least a few words" };
  if (trimmed.length > 2000) return { error: "Description too long (max 2000 chars)" };

  const ownerId = await assertOwner(clubId);
  if (!ownerId) return { error: "Unauthorized" };

  try {
    const ctx = await loadClubContext(clubId);
    const result = await generateDraft({
      clubId,
      ownerId,
      contentType: "event",
      schema: eventDraftSchema,
      userPrompt: trimmed,
      templateVars: {
        club_name: ctx.name,
        club_description: ctx.description,
      },
    });
    return { ok: true, draft: result.draft };
  } catch (err) {
    console.error("[ai-actions] generateEventDraftAction", clubId, err);
    const msg = err instanceof Error ? err.message : "unknown";
    return { error: `AI generation failed: ${cleanErrorMessage(msg)}` };
  }
}
