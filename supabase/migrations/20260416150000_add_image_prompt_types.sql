-- Tower-manage quest/event image prompts.
--
-- Before this migration, image-gen prompts were hardcoded server-side in
-- app/[clubSlug]/admin/ai-actions.ts:generateQuestImageAction and
-- generateEventImageAction. Admin had no way to tune them without a deploy.
-- This migration:
--   1. Extends the ai_prompts.content_type CHECK constraint with two new
--      values: 'quest_image' and 'event_image'.
--   2. Seeds v1 rows for both so loadPrompt() works on first call.
--
-- Template placeholders for image prompts:
--   {{title}}          — quest / event title
--   {{description}}    — optional description prefixed with " — " or empty
--   {{primary_color}}  — club brand color hex
--   {{style_hint}}     — admin's optional style input or empty string
--
-- system_prompt is unused by the image model (generateImage takes only a
-- single prompt string) but we store a short note there so the tower UI
-- still renders something meaningful in the system prompt box.

-- ---------------------------------------------------------------------------
-- 1. Extend CHECK constraint
-- ---------------------------------------------------------------------------
ALTER TABLE ai_prompts DROP CONSTRAINT ai_prompts_content_type_check;

ALTER TABLE ai_prompts ADD CONSTRAINT ai_prompts_content_type_check
  CHECK (content_type IN (
    'quest', 'event', 'offer', 'badge', 'setup_agent',
    'quest_image', 'event_image'
  ));

-- ---------------------------------------------------------------------------
-- 2. Seed v1 rows for the two image types
-- ---------------------------------------------------------------------------
INSERT INTO ai_prompts (content_type, version, system_prompt, user_template, model, active, updated_by) VALUES
(
  'quest_image',
  1,
  'Image generation prompt for quest badges. The system prompt is not used by the image model; edit the user template below to change the badge style. Goal: produce a circular badge sticker isolated on a transparent background so it composes cleanly on the member profile.',
  'Badge sticker illustration representing: {{title}}{{description}}.
Circular composition that fills the entire frame edge-to-edge.
Isolated subject on transparent background (PNG with alpha), no backdrop, no square border, no scene.
Flat vector, minimal, {{primary_color}} brand color accent, no text, no watermark.
{{style_hint}}',
  'google/gemini-3.1-flash-image-preview',
  true,
  'migration-v1'
),
(
  'event_image',
  1,
  'Image generation prompt for event flyers. The system prompt is not used by the image model; edit the user template below to change the flyer style. Goal: a vivid 16:9 illustration suitable for an event card header.',
  'Event poster / flyer illustration for: {{title}}{{description}}.
Landscape 16:9 composition, vivid and atmospheric, cinematic lighting.
{{primary_color}} brand tint, no text, no logos, no watermark.
{{style_hint}}',
  'google/gemini-3.1-flash-image-preview',
  true,
  'migration-v1'
);
