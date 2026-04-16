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

// NOTE: offerDraftSchema and badgeDraftSchema used to live here. Both
// were removed — offers intentionally don't get AI assist (custom-offer
// creation is too trivial to be worth it), and badges have no standalone
// UI (they're created implicitly via the quest "Award badge" flow). The
// ContentType union still includes both for DB/seed compatibility with
// the ai_prompts table.

// Setup wizard batch schema — used by Phase 5 one-shot "build my club"
// flow. Returns a small starter kit the admin can review and bulk-save.
// Offers and badges are intentionally not here; badges will auto-attach
// to any quest that has award_badge implied by the AI.
export const setupDraftSchema = z.object({
  overview: z.string().max(400).describe("1-2 sentence summary of what this starter kit contains and why it fits the described club"),
  quests: z.array(questDraftSchema).min(1).max(6),
  events: z.array(eventDraftSchema).max(3),
});
export type SetupDraft = z.infer<typeof setupDraftSchema>;

export type ContentType =
  | "quest"
  | "event"
  | "offer"
  | "badge"
  | "setup_agent"
  | "quest_image"
  | "event_image";

export const SCHEMAS = {
  quest: questDraftSchema,
  event: eventDraftSchema,
} as const;
