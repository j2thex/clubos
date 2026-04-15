"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateDraft } from "@/lib/ai/generate-content";
import {
  questDraftSchema,
  eventDraftSchema,
  type QuestDraft,
  type EventDraft,
} from "@/lib/ai/schemas";
import { getOwnerFromCookie } from "@/lib/auth";

// Admin-side server actions for AI-assisted content drafting.
// Each function fetches club context, calls the AI module, and returns
// a typed draft that the client manager prefills into its form state.

async function loadClubContext(clubId: string): Promise<{
  name: string;
  description: string;
  primaryColor: string;
}> {
  const supabase = createAdminClient();
  const [{ data: club }, { data: branding }] = await Promise.all([
    supabase.from("clubs").select("name").eq("id", clubId).single(),
    supabase
      .from("club_branding")
      .select("hero_content, primary_color")
      .eq("club_id", clubId)
      .maybeSingle(),
  ]);

  return {
    name: club?.name ?? "the club",
    description: branding?.hero_content ?? "",
    primaryColor: branding?.primary_color ?? "#16a34a",
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
      },
    });
    return { ok: true, draft: result.draft };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { error: `AI generation failed: ${cleanErrorMessage(msg)}` };
  }
}

function cleanErrorMessage(msg: string): string {
  // Strip URLs so we don't leak half a link to the user
  const urlless = msg.replace(/https?:\/\/\S+/g, "").trim();
  return urlless.slice(0, 220);
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
    const msg = err instanceof Error ? err.message : "unknown";
    return { error: `AI generation failed: ${cleanErrorMessage(msg)}` };
  }
}
