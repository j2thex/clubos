-- Add optional end_time to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS end_time time;
