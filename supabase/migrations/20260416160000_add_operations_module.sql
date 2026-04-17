-- Operations Module feature flag (cannabis-club door + POS layer).
-- Off by default for every club. Only clubs that explicitly opt in see the staff operations pages.
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS operations_module_enabled boolean NOT NULL DEFAULT false;
