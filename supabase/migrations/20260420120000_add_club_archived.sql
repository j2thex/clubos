-- Club archival: tower admins can archive clubs to hide them from
-- discover/sitemap/public and block all member/staff/admin access while
-- retaining the data. Archival is reversible.
--
-- Using nullable timestamptz so we keep "when was it archived" for free.

ALTER TABLE clubs ADD COLUMN archived_at timestamptz;

CREATE INDEX idx_clubs_archived_at ON clubs(archived_at) WHERE archived_at IS NOT NULL;
