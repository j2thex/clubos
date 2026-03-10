-- Membership period options configured by admin
CREATE TABLE membership_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  duration_months integer NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_membership_periods_club ON membership_periods(club_id);

-- Add membership tracking to members
ALTER TABLE members
  ADD COLUMN membership_period_id uuid REFERENCES membership_periods(id),
  ADD COLUMN valid_till date;
