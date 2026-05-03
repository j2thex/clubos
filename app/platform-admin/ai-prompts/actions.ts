"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { invalidatePromptCache } from "@/lib/ai/prompts";
import { requirePlatformAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

const CONTENT_TYPES = [
  "quest",
  "event",
  "offer",
  "badge",
  "setup_agent",
  "quest_image",
  "event_image",
] as const;
type ContentType = (typeof CONTENT_TYPES)[number];

function isContentType(v: string): v is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(v);
}

function isImageType(v: ContentType): boolean {
  return v === "quest_image" || v === "event_image";
}

export async function savePromptVersion(
  formData: FormData,
): Promise<{ error: string } | { ok: true; version: number }> {
  try { await requirePlatformAdmin(); } catch { return { error: "Unauthorized" }; }

  const contentType = String(formData.get("content_type") ?? "");
  const systemPrompt = String(formData.get("system_prompt") ?? "").trim();
  const userTemplate = String(formData.get("user_template") ?? "").trim();
  const model = String(formData.get("model") ?? "anthropic/claude-sonnet-4.6").trim();

  if (!isContentType(contentType)) return { error: "Invalid content_type" };
  // Image types don't use a system prompt (the image model takes only a
  // single prompt string), so we don't enforce a minimum length there.
  const minSystemLen = isImageType(contentType) ? 0 : 10;
  if (systemPrompt.length < minSystemLen) return { error: "system_prompt is too short" };
  if (userTemplate.length < 1) return { error: "user_template is required" };
  if (!model.includes("/")) return { error: "model must be in 'provider/model' format" };

  const supabase = createAdminClient();

  // Find current active + max version
  const { data: rows, error: rowsErr } = await supabase
    .from("ai_prompts")
    .select("id, version, active")
    .eq("content_type", contentType)
    .order("version", { ascending: false });

  if (rowsErr) return { error: `Lookup failed: ${rowsErr.message}` };

  const maxVersion = rows?.[0]?.version ?? 0;
  const prevActive = rows?.find((r) => r.active);

  // Step 1: deactivate the prior active row (partial unique index would
  // otherwise block our insert of a second active row for the same type).
  if (prevActive) {
    const { error: deactErr } = await supabase
      .from("ai_prompts")
      .update({ active: false })
      .eq("id", prevActive.id);
    if (deactErr) return { error: `Deactivate failed: ${deactErr.message}` };
  }

  // Step 2: insert the new version as active.
  const { error: insertErr } = await supabase.from("ai_prompts").insert({
    content_type: contentType,
    version: maxVersion + 1,
    system_prompt: systemPrompt,
    user_template: userTemplate,
    model,
    active: true,
    updated_by: "platform-admin",
  });

  if (insertErr) {
    // Best-effort rollback: restore the prior active row.
    if (prevActive) {
      await supabase
        .from("ai_prompts")
        .update({ active: true })
        .eq("id", prevActive.id);
    }
    return { error: `Insert failed: ${insertErr.message}` };
  }

  invalidatePromptCache(contentType);
  revalidatePath("/platform-admin/ai-prompts");
  return { ok: true, version: maxVersion + 1 };
}

export async function restorePromptVersion(
  rowId: string,
): Promise<{ error: string } | { ok: true }> {
  try { await requirePlatformAdmin(); } catch { return { error: "Unauthorized" }; }

  const supabase = createAdminClient();

  const { data: target, error: targetErr } = await supabase
    .from("ai_prompts")
    .select("id, content_type, active")
    .eq("id", rowId)
    .single();
  if (targetErr || !target) return { error: "Version not found" };
  if (target.active) return { ok: true };

  // Deactivate current active for this content_type, then activate the chosen row.
  const { error: deactErr } = await supabase
    .from("ai_prompts")
    .update({ active: false })
    .eq("content_type", target.content_type)
    .eq("active", true);
  if (deactErr) return { error: `Deactivate failed: ${deactErr.message}` };

  const { error: actErr } = await supabase
    .from("ai_prompts")
    .update({ active: true })
    .eq("id", rowId);
  if (actErr) return { error: `Activate failed: ${actErr.message}` };

  invalidatePromptCache(target.content_type as ContentType);
  revalidatePath("/platform-admin/ai-prompts");
  return { ok: true };
}
