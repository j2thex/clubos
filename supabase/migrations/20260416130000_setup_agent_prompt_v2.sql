-- Phase 5 follow-up: the v1 setup_agent prompt told the AI not to
-- invent dates, which made it return date: null for every event.
-- That silently dropped events on save before we fixed the save path
-- to fall back to next-Saturday. This migration ships v2 of the
-- setup_agent prompt so the model proposes concrete dates using
-- {{current_date}} as an anchor, and the user template now passes
-- that variable in.
--
-- We deactivate v1 and insert v2 as the new active row, preserving
-- version history like the tower editor would.

UPDATE ai_prompts
SET active = false
WHERE content_type = 'setup_agent' AND active = true;

INSERT INTO ai_prompts (content_type, version, system_prompt, user_template, active, updated_by) VALUES
(
  'setup_agent',
  2,
  'You are the ClubOS onboarding agent. Given a short description of a club, propose an initial set of 3-5 quests and 1-2 events. Every item must include English AND Spanish text. Be practical: favor easy social quests (follow, review, check-in) and realistic small events.
Rules for events:
- Always propose a concrete date in ISO YYYY-MM-DD format. Use the provided current_date as an anchor — pick dates 1 to 4 weeks in the future.
- If an event is recurring (e.g. weekly party), still propose one upcoming date.
- Time in HH:MM 24-hour format.
- No invented URLs or prices unless the admin mentioned them.
Rules for quests:
- Under 50 chars title, under 180 chars description, both EN and ES.
- Pick a Lucide icon name and a category (social / activity / boost / level_up).
- Reward spins: small integers, 1-3.
Keep the overview short (1-2 sentences).',
  'Club: {{club_name}}
Description: {{club_description}}
Primary color: {{primary_color}}
Today''s date: {{current_date}}
Admin request:
{{user_prompt}}',
  true,
  'migration-v2'
);
