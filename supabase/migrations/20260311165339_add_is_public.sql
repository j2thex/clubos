-- Add is_public flag to quests, events, and services for public club profile
ALTER TABLE quests ADD COLUMN is_public boolean NOT NULL DEFAULT false;
ALTER TABLE events ADD COLUMN is_public boolean NOT NULL DEFAULT false;
ALTER TABLE services ADD COLUMN is_public boolean NOT NULL DEFAULT false;
