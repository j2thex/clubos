ALTER TABLE clubs ADD COLUMN invite_mode text NOT NULL DEFAULT 'form';

CREATE TABLE club_invite_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id),
  type text NOT NULL,
  label text,
  url text NOT NULL,
  icon_url text,
  display_order integer NOT NULL DEFAULT 0
);

CREATE INDEX idx_club_invite_buttons_club ON club_invite_buttons(club_id);
ALTER TABLE club_invite_buttons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON club_invite_buttons FOR ALL USING (true) WITH CHECK (true);
