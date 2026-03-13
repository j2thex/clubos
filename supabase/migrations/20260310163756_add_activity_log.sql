-- Activity log for admin audit trail
CREATE TABLE activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  staff_member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_member_code text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_log_club_created ON activity_log(club_id, created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
