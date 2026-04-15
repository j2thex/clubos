"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { generateDraft } from "@/lib/ai/generate-content";
import { questDraftSchema, type QuestDraft } from "@/lib/ai/schemas";
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

export async function generateQuestDraftAction(
  clubId: string,
  userPrompt: string,
): Promise<{ error: string } | { ok: true; draft: QuestDraft }> {
  const trimmed = userPrompt.trim();
  if (trimmed.length < 3) return { error: "Describe the quest in at least a few words" };
  if (trimmed.length > 1000) return { error: "Description too long (max 1000 chars)" };

  // Cookie-based owner check — same pattern as feedback-action.ts.
  // Middleware already gates /admin/* but an explicit check keeps this
  // safe if the action is ever called from a less-protected surface.
  let ownerId: string | null = null;
  try {
    const owner = await getOwnerFromCookie();
    if (owner && owner.club_id === clubId) ownerId = owner.owner_id;
  } catch {
    /* no cookie */
  }
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
    return { error: `AI generation failed: ${msg.slice(0, 180)}` };
  }
}
