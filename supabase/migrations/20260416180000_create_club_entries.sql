-- Operations Module — physical club entry sessions (door check-in / check-out).
-- A row is created on admission; checked_out_at is filled when a staff member
-- explicitly checks the member out. A member may have one open entry at a time
-- (enforced via the "open entries" partial unique index below).

CREATE TABLE IF NOT EXISTS club_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_in_by uuid REFERENCES members(id) ON DELETE SET NULL,
  checked_out_at timestamptz,
  checked_out_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fast capacity dashboard: list everyone still inside for a club.
CREATE INDEX IF NOT EXISTS idx_club_entries_open
  ON club_entries(club_id)
  WHERE checked_out_at IS NULL;

-- History view & member detail.
CREATE INDEX IF NOT EXISTS idx_club_entries_club_in
  ON club_entries(club_id, checked_in_at DESC);

CREATE INDEX IF NOT EXISTS idx_club_entries_member_in
  ON club_entries(member_id, checked_in_at DESC);

-- A member can only have one open session at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_club_entries_one_open_per_member
  ON club_entries(member_id)
  WHERE checked_out_at IS NULL;

ALTER TABLE club_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages club entries"
  ON club_entries FOR ALL
  USING (auth.role() = 'service_role');
