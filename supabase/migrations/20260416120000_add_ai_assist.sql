-- AI-assisted admin entry foundation (Phase 0)
--
-- Three tables:
--   ai_prompts          — tower-editable system/user prompt templates, versioned
--   club_ai_settings    — per-club toggle, optional BYOK (encrypted), monthly quotas
--   ai_generations      — audit trail + quota counter for every AI call
--
-- RLS enabled on all three; no permissive policies. All access goes through
-- server code using the service role (createAdminClient), matching how
-- existing tables like clubs / quests are accessed.

-- ---------------------------------------------------------------------------
-- ai_prompts : tower-managed prompt library
-- ---------------------------------------------------------------------------
CREATE TABLE ai_prompts (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type    text        NOT NULL,
  version         integer     NOT NULL,
  system_prompt   text        NOT NULL,
  user_template   text        NOT NULL,
  model           text        NOT NULL DEFAULT 'anthropic/claude-sonnet-4.6',
  active          boolean     NOT NULL DEFAULT false,
  updated_by      text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_prompts_content_type_check
    CHECK (content_type IN ('quest', 'event', 'offer', 'badge', 'setup_agent')),
  CONSTRAINT ai_prompts_content_type_version_key
    UNIQUE (content_type, version)
);

-- Only one active row per content_type. Partial unique index is the clean way.
CREATE UNIQUE INDEX ai_prompts_one_active_per_type
  ON ai_prompts (content_type)
  WHERE active = true;

ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- club_ai_settings : per-club toggle + BYOK + quotas
-- ---------------------------------------------------------------------------
CREATE TABLE club_ai_settings (
  club_id                  uuid        PRIMARY KEY REFERENCES clubs(id) ON DELETE CASCADE,
  enabled                  boolean     NOT NULL DEFAULT true,
  byok_provider            text,
  byok_key_encrypted       text,
  byok_key_iv              text,
  byok_key_tag             text,
  monthly_token_limit      integer     NOT NULL DEFAULT 200000,
  monthly_images_limit     integer     NOT NULL DEFAULT 30,
  tokens_used_this_month   integer     NOT NULL DEFAULT 0,
  images_used_this_month   integer     NOT NULL DEFAULT 0,
  quota_period_start       date        NOT NULL DEFAULT date_trunc('month', now())::date,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT club_ai_settings_byok_provider_check
    CHECK (byok_provider IS NULL OR byok_provider IN ('anthropic', 'openai'))
);

ALTER TABLE club_ai_settings ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- ai_generations : audit log + billing / quota source of truth
-- ---------------------------------------------------------------------------
CREATE TABLE ai_generations (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id        uuid        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  owner_id       uuid,
  content_type   text        NOT NULL,
  kind           text        NOT NULL, -- 'text' | 'image'
  model          text        NOT NULL,
  prompt_version integer,
  tokens_in      integer     NOT NULL DEFAULT 0,
  tokens_out     integer     NOT NULL DEFAULT 0,
  image_count    integer     NOT NULL DEFAULT 0,
  cost_cents     integer     NOT NULL DEFAULT 0,
  byok           boolean     NOT NULL DEFAULT false,
  status         text        NOT NULL DEFAULT 'success', -- 'success' | 'error'
  error_message  text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_generations_kind_check CHECK (kind IN ('text', 'image')),
  CONSTRAINT ai_generations_status_check CHECK (status IN ('success', 'error'))
);

CREATE INDEX ai_generations_club_id_created_at_idx
  ON ai_generations (club_id, created_at DESC);

ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Seed default prompts so Phase 0 is self-contained even before the tower UI
-- (Phase 1) exists. These can be edited later via the tower page.
-- ---------------------------------------------------------------------------
INSERT INTO ai_prompts (content_type, version, system_prompt, user_template, active, updated_by) VALUES
(
  'quest',
  1,
  'You are an expert at writing short, punchy quest copy for a club loyalty app. A "quest" is a small action a club member can do to earn spin rewards (e.g. follow on Instagram, leave a Google review, attend an event). Rules:
- Write in both English AND Spanish. Match tone to a cool neighborhood club.
- Keep titles under 50 chars, descriptions under 180 chars.
- Pick the most appropriate category: social (follows/reviews/shares), activity (visits/events/check-ins), boost (anything that multiplies rewards), level_up (tutorials, feedback, onboarding).
- Pick an appropriate Lucide icon name (e.g. instagram, star, camera, map-pin, message-circle).
- Reward spins must be a small integer: 1 for easy, 2 for effortful, 3+ only for high-value referrals.
- Do not invent URLs.',
  'Club context: {{club_name}} — {{club_description}}
Admin request:
{{user_prompt}}',
  true,
  'seed'
),
(
  'event',
  1,
  'You write concise event listings for a club. Rules:
- Write in English AND Spanish.
- Extract title, description, date, time, price, and a Lucide icon.
- If the admin pastes a flyer, pull fields out of it. Unknown fields → null.
- Keep descriptions under 240 chars. No marketing fluff.',
  'Club context: {{club_name}} — {{club_description}}
Admin request:
{{user_prompt}}',
  true,
  'seed'
),
(
  'offer',
  1,
  'You write member offer listings (discounts, perks, services) for a club. Rules:
- Write in English AND Spanish.
- Pick the best matching catalog_id from the provided list (or leave null if nothing fits).
- Keep descriptions under 200 chars.
- Price is a number; omit if unknown.',
  'Club context: {{club_name}} — {{club_description}}
Available offer catalog:
{{offer_catalog}}
Admin request:
{{user_prompt}}',
  true,
  'seed'
),
(
  'badge',
  1,
  'You design achievement badges for a club loyalty program. Rules:
- Write a short name (<=24 chars) and a one-sentence description explaining how it is earned.
- Pick a single hex color that fits the club brand.
- Pick a Lucide icon name as a text-only fallback.
- Also produce a concise image prompt for an image model: "flat vector badge icon, centered, circular frame, {{primary_color}} brand color, minimal, no text". Keep under 40 words.',
  'Club context: {{club_name}} — {{club_description}}
Brand primary color: {{primary_color}}
Admin request:
{{user_prompt}}',
  true,
  'seed'
),
(
  'setup_agent',
  1,
  'You are the ClubOS onboarding agent. Given a short description of a club, propose an initial set of 3-5 quests, 1-2 events, 2-3 offers, and 2-3 badges. Each item must include both English and Spanish text. Be practical: favor easy social quests (follow, review) and realistic offers. Do not invent links or dates.',
  'Club: {{club_name}}
Description: {{club_description}}
Primary color: {{primary_color}}
Admin request:
{{user_prompt}}',
  true,
  'seed'
);
