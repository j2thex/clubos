-- Club-scoped roles (admin-configurable)
CREATE TABLE member_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(club_id, name)
);

CREATE INDEX idx_member_roles_club ON member_roles(club_id);

-- Add role_id to members
ALTER TABLE members ADD COLUMN role_id uuid REFERENCES member_roles(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read member roles" ON member_roles
  FOR SELECT USING (true);
