import { z } from "zod";

// Zod schemas that mirror the shape we want the LLM to produce for each
// content type. These are the *draft* shapes — they prefill admin forms,
// they do NOT bypass the existing server-action validation in actions.ts.
// Every field is optional so a partial draft is still accepted (admin
// reviews and fills in the rest manually before saving).

export const questDraftSchema = z.object({
  title: z.string().max(80).describe("English quest title, under 50 chars ideally"),
  title_es: z.string().max(80).describe("Spanish quest title"),
  description: z.string().max(300).nullable().describe("English description, under 180 chars"),
  description_es: z.string().max(300).nullable().describe("Spanish description"),
  link: z.string().url().nullable().describe("External URL the member needs to visit, or null"),
  icon: z.string().max(40).nullable().describe("Lucide icon name, e.g. 'instagram', 'star'"),
  reward_spins: z.number().int().min(0).max(20),
  category: z.enum(["social", "activity", "boost", "level_up"]),
  quest_type: z.enum(["default", "referral", "feedback", "tutorial"]),
  proof_mode: z.enum(["none", "optional", "required"]),
  multi_use: z.boolean(),
  tutorial_steps: z.array(z.string()).nullable(),
});
export type QuestDraft = z.infer<typeof questDraftSchema>;

export const eventDraftSchema = z.object({
  title: z.string().max(120),
  title_es: z.string().max(120),
  description: z.string().max(500).nullable(),
  description_es: z.string().max(500).nullable(),
  date: z.string().nullable().describe("ISO date YYYY-MM-DD or null"),
  time: z.string().nullable().describe("HH:MM 24-hour or null"),
  end_time: z.string().nullable(),
  price: z.number().nonnegative().nullable(),
  icon: z.string().max(40).nullable(),
  link: z.string().url().nullable(),
  location_name: z.string().max(120).nullable(),
});
export type EventDraft = z.infer<typeof eventDraftSchema>;

export const offerDraftSchema = z.object({
  catalog_id: z.string().uuid().nullable().describe("Best matching offer_catalog.id or null"),
  description: z.string().max(300).nullable(),
  description_es: z.string().max(300).nullable(),
  price: z.number().nonnegative().nullable(),
  icon: z.string().max(40).nullable(),
  link: z.string().url().nullable(),
});
export type OfferDraft = z.infer<typeof offerDraftSchema>;

// NOTE: there used to be a badgeDraftSchema / BadgeDraft exported here —
// it was removed in the Phase 4 revision because badges are created
// implicitly via the quest "Award badge" flow, not through a standalone
// badges UI. The tower still keeps the "badge" prompt row in ai_prompts
// for archival reasons; the ContentType union keeps "badge" for DB FK
// compatibility but nothing active references it.

export type ContentType = "quest" | "event" | "offer" | "badge" | "setup_agent";

export const SCHEMAS = {
  quest: questDraftSchema,
  event: eventDraftSchema,
  offer: offerDraftSchema,
} as const;
