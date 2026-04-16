-- Phase 5 hotfix: events.display_order was referenced by the Phase 5 setup
-- wizard bulk-insert path (app/[clubSlug]/admin/ai-actions.ts) and by
-- setupStandardContent in app/platform-admin/actions.ts, but the column
-- was never actually added to the events table. Defaulting to 0 matches
-- how quests / badges / wheel_configs seed their first rows. NOT NULL with
-- a default is safe to backfill across existing rows in one step.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0;
