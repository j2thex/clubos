-- Invite-only flag on clubs
ALTER TABLE clubs ADD COLUMN invite_only boolean NOT NULL DEFAULT false;

-- Track whether club has been claimed by an owner
ALTER TABLE clubs ADD COLUMN claimed boolean NOT NULL DEFAULT true;

-- Invite requests from visitors
CREATE TABLE invite_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  contact text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invite_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invite_requests_rw" ON invite_requests FOR ALL USING (true);
CREATE INDEX idx_invite_requests_club ON invite_requests(club_id);
