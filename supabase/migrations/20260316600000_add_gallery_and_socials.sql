-- Social links on club_branding
ALTER TABLE club_branding ADD COLUMN social_instagram text;
ALTER TABLE club_branding ADD COLUMN social_whatsapp text;
ALTER TABLE club_branding ADD COLUMN social_telegram text;
ALTER TABLE club_branding ADD COLUMN social_google_maps text;

-- Photo gallery
CREATE TABLE club_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE club_gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery_rw" ON club_gallery FOR ALL USING (true);
CREATE INDEX idx_gallery_club ON club_gallery(club_id);
