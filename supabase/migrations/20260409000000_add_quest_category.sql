-- Add category column to quests (social, activity, boost, level_up)
ALTER TABLE quests ADD COLUMN category text;

UPDATE quests SET category = CASE
  WHEN quest_type = 'referral' THEN 'social'
  WHEN quest_type = 'feedback' THEN 'level_up'
  WHEN quest_type = 'tutorial' THEN 'level_up'
  ELSE 'social'
END;

ALTER TABLE quests ALTER COLUMN category SET NOT NULL;
ALTER TABLE quests ALTER COLUMN category SET DEFAULT 'social';
ALTER TABLE quests ADD CONSTRAINT quests_category_check
  CHECK (category IN ('social', 'activity', 'boost', 'level_up'));
