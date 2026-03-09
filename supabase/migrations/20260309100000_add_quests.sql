CREATE TABLE quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  link text,
  reward_spins int NOT NULL DEFAULT 1,
  active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE member_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id uuid REFERENCES quests(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  completed_at timestamptz DEFAULT now(),
  verified_by uuid REFERENCES members(id) ON DELETE SET NULL,
  UNIQUE(quest_id, member_id)
);

CREATE INDEX idx_quests_club ON quests(club_id);
CREATE INDEX idx_member_quests_member ON member_quests(member_id);
CREATE INDEX idx_member_quests_quest ON member_quests(quest_id);

ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_quests ENABLE ROW LEVEL SECURITY;
