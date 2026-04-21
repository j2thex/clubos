-- Marketing attribution: where did each member come from?
-- Free text per club (e.g. "alejandra", "instagram", "tiktok", "walk-in").
-- Dashboard reads distinct values per club to populate a datalist.

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS marketing_channel text;

CREATE INDEX IF NOT EXISTS idx_members_club_channel
  ON members(club_id, marketing_channel)
  WHERE marketing_channel IS NOT NULL;
