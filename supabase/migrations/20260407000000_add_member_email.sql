-- Add email and email opt-out to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS email_opt_out boolean NOT NULL DEFAULT false;

-- Index for campaign queries (find members with email who haven't opted out)
CREATE INDEX IF NOT EXISTS idx_members_email_opt ON members (club_id) WHERE email IS NOT NULL AND email_opt_out = false;
