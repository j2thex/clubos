-- Add optional deadline to quests
ALTER TABLE quests ADD COLUMN IF NOT EXISTS deadline timestamptz;
