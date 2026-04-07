-- Add auto_registration flag to clubs (only meaningful when preregistration_enabled = true)
ALTER TABLE clubs ADD COLUMN auto_registration boolean NOT NULL DEFAULT false;

-- Add member_id FK to preregistrations to link auto-created members
ALTER TABLE preregistrations ADD COLUMN member_id uuid REFERENCES members(id) ON DELETE SET NULL;
CREATE INDEX idx_preregistrations_member ON preregistrations(member_id) WHERE member_id IS NOT NULL;
