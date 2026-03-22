ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_rule text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_parent_id uuid REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE events ADD COLUMN IF NOT EXISTS recurrence_end_date date;
CREATE INDEX IF NOT EXISTS idx_events_recurrence_parent ON events(recurrence_parent_id);
