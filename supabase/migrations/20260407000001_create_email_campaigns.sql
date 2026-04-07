-- Email campaigns table
CREATE TABLE IF NOT EXISTS email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body_markdown text NOT NULL,
  segment_filters jsonb NOT NULL DEFAULT '{}',
  recipient_count int NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now(),
  sent_by uuid REFERENCES club_owners(id)
);

-- RLS
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_campaigns_club_scope" ON email_campaigns
  FOR ALL USING (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_email_campaigns_club ON email_campaigns (club_id, sent_at DESC);
