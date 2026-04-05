-- Add pre-registration feature
ALTER TABLE clubs ADD COLUMN preregistration_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE preregistrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email text NOT NULL,
  visit_date date NOT NULL,
  num_visitors integer NOT NULL DEFAULT 1,
  age_confirmed boolean NOT NULL DEFAULT false,
  disclaimer_accepted boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES members(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE preregistrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "preregistrations_rw" ON preregistrations FOR ALL USING (true);
CREATE INDEX idx_preregistrations_club ON preregistrations(club_id);
CREATE INDEX idx_preregistrations_status ON preregistrations(club_id, status);
