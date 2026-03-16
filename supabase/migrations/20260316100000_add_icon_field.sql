-- Add icon field to content tables (stores lucide-react icon name)
ALTER TABLE quests ADD COLUMN icon text;
ALTER TABLE events ADD COLUMN icon text;
ALTER TABLE services ADD COLUMN icon text;
