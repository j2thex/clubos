-- Club owners: email + password authentication for admin panel
CREATE TABLE club_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  password_hash text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now()
);

-- Junction table for owner-club relationships
CREATE TABLE club_owner_clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES club_owners(id) ON DELETE CASCADE NOT NULL,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'owner' NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, club_id)
);

CREATE UNIQUE INDEX idx_club_owners_email ON club_owners(LOWER(email));
CREATE INDEX idx_club_owner_clubs_owner ON club_owner_clubs(owner_id);
CREATE INDEX idx_club_owner_clubs_club ON club_owner_clubs(club_id);

ALTER TABLE club_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_owner_clubs ENABLE ROW LEVEL SECURITY;
