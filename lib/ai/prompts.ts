import { createAdminClient } from "@/lib/supabase/admin";
import type { ContentType } from "./schemas";

// Loads the active prompt row for a content type from ai_prompts.
// Cached in-memory for 30 seconds to avoid hammering the DB on every call.
// When the tower UI updates a prompt, the edit flow should bump this cache.

export interface LoadedPrompt {
  id: string;
  content_type: ContentType;
  version: number;
  system_prompt: string;
  user_template: string;
  model: string;
}

const CACHE_TTL_MS = 30_000;
const cache = new Map<ContentType, { value: LoadedPrompt; expires: number }>();

export function invalidatePromptCache(contentType?: ContentType): void {
  if (contentType) cache.delete(contentType);
  else cache.clear();
}

export async function loadPrompt(contentType: ContentType): Promise<LoadedPrompt> {
  const hit = cache.get(contentType);
  if (hit && hit.expires > Date.now()) return hit.value;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ai_prompts")
    .select("id, content_type, version, system_prompt, user_template, model")
    .eq("content_type", contentType)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error("[loadPrompt]", contentType, error);
    throw new Error(`loadPrompt(${contentType}) failed: ${error.message}`);
  }
  if (!data) {
    console.error("[loadPrompt] no active row", contentType);
    throw new Error(`No active prompt found for content_type=${contentType}`);
  }

  const value = data as LoadedPrompt;
  cache.set(contentType, { value, expires: Date.now() + CACHE_TTL_MS });
  return value;
}

// Substitute {{variable}} placeholders in a template. Unknown placeholders
// are replaced with empty string so prompts don't leak literal braces.
export function renderTemplate(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}
