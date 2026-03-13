-- Add image_url to quests
ALTER TABLE quests ADD COLUMN image_url text;

-- Services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  link text,
  price numeric(10,2),
  active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_services_club ON services(club_id);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
