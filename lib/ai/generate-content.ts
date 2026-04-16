import { generateText, Output } from "ai";
import type { z } from "zod";
import { loadPrompt, renderTemplate } from "./prompts";
import { resolveModelForClub } from "./gateway";
import { checkQuota, recordUsage } from "./quota";
import type { ContentType } from "./schemas";

// Generate a structured draft for a content type. The caller passes the Zod
// schema (from ./schemas) and the raw admin free-text prompt + any extra
// template vars (club_name, club_description, offer_catalog, etc.).
//
// Returns the parsed object or throws. Writes an ai_generations row either
// way (success or error) and consumes quota on success.

export interface GenerateContentArgs<TSchema extends z.ZodTypeAny> {
  clubId: string;
  ownerId?: string | null;
  contentType: ContentType;
  schema: TSchema;
  userPrompt: string;
  templateVars?: Record<string, string | number | null | undefined>;
}

export interface GenerateContentResult<T> {
  draft: T;
  promptVersion: number;
  model: string;
  byok: boolean;
}

export async function generateDraft<TSchema extends z.ZodTypeAny>(
  args: GenerateContentArgs<TSchema>,
): Promise<GenerateContentResult<z.infer<TSchema>>> {
  const quota = await checkQuota(args.clubId, "text");
  if (!quota.allowed) throw new Error(quota.reason ?? "Quota exceeded");

  const prompt = await loadPrompt(args.contentType);
  const resolved = await resolveModelForClub(args.clubId, prompt.model);

  const rendered = renderTemplate(prompt.user_template, {
    ...args.templateVars,
    user_prompt: args.userPrompt,
  });

  try {
    const result = await generateText({
      model: resolved.modelId,
      system: prompt.system_prompt,
      prompt: rendered,
      experimental_output: Output.object({ schema: args.schema }),
      providerOptions: {
        gateway: {
          tags: [`feature:ai-assist`, `content:${args.contentType}`, `club:${args.clubId}`],
        },
      },
    });

    const draft = (result as { experimental_output: z.infer<TSchema> }).experimental_output;
    const usage = (result as { usage?: { inputTokens?: number; outputTokens?: number } }).usage;

    await recordUsage({
      clubId: args.clubId,
      ownerId: args.ownerId ?? null,
      contentType: args.contentType,
      kind: "text",
      model: resolved.modelId,
      promptVersion: prompt.version,
      tokensIn: usage?.inputTokens ?? 0,
      tokensOut: usage?.outputTokens ?? 0,
      byok: resolved.byok,
      status: "success",
    });

    return {
      draft,
      promptVersion: prompt.version,
      model: resolved.modelId,
      byok: resolved.byok,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    await recordUsage({
      clubId: args.clubId,
      ownerId: args.ownerId ?? null,
      contentType: args.contentType,
      kind: "text",
      model: resolved.modelId,
      promptVersion: prompt.version,
      byok: resolved.byok,
      status: "error",
      errorMessage: msg.slice(0, 500),
    });
    throw err;
  }
}
