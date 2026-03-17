-- Add tutorial_steps column for tutorial quest type
ALTER TABLE quests ADD COLUMN tutorial_steps jsonb;
