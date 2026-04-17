-- Operations Module — extend members with DOB + ID verification state.
-- All fields are nullable; required only when a club has operations_module_enabled.
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS id_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS id_verified_by uuid REFERENCES members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS id_photo_path text;

-- Fast age / DOB lookups within a club.
CREATE INDEX IF NOT EXISTS idx_members_club_dob
  ON members(club_id, date_of_birth);
