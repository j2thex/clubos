-- Add unique constraint on membership_periods for upsert support
ALTER TABLE membership_periods ADD UNIQUE (club_id, name);
