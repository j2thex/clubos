-- Badge definitions (admin creates these)
CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text,
  color text DEFAULT '#6b7280',
  active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_club_read" ON badges FOR SELECT USING (true);
CREATE POLICY "badges_club_write" ON badges FOR ALL USING (true);
CREATE INDEX idx_badges_club ON badges(club_id);

-- Link badges to quests (which quest awards which badge)
ALTER TABLE quests ADD COLUMN badge_id uuid REFERENCES badges(id) ON DELETE SET NULL;

-- Track which members have earned which badges
CREATE TABLE member_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  quest_id uuid REFERENCES quests(id) ON DELETE SET NULL,
  UNIQUE(member_id, badge_id)
);

ALTER TABLE member_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "member_badges_read" ON member_badges FOR SELECT USING (true);
CREATE POLICY "member_badges_write" ON member_badges FOR ALL USING (true);
CREATE INDEX idx_member_badges_member ON member_badges(member_id);
CREATE INDEX idx_member_badges_badge ON member_badges(badge_id);
