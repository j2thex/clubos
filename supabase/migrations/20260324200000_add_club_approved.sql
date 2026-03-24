-- Add approval gate for clubs — new clubs start unapproved, platform admin approves
ALTER TABLE clubs ADD COLUMN approved boolean NOT NULL DEFAULT false;

-- Mark all existing clubs as approved so nothing breaks
UPDATE clubs SET approved = true WHERE active = true;
