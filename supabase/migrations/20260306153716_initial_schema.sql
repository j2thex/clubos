-- Organizations
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  mode text NOT NULL DEFAULT 'standalone',
  created_at timestamptz DEFAULT now()
);

-- Clubs
CREATE TABLE clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  active boolean DEFAULT true,
  timezone text DEFAULT 'UTC',
  currency text DEFAULT 'USD',
  created_at timestamptz DEFAULT now()
);

-- Club branding
CREATE TABLE club_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid UNIQUE REFERENCES clubs(id) ON DELETE CASCADE,
  logo_url text,
  theme_name text DEFAULT 'default',
  primary_color text DEFAULT '#16a34a',
  secondary_color text DEFAULT '#052e16',
  hero_content text,
  created_at timestamptz DEFAULT now()
);

-- Members
CREATE TABLE members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  member_code text NOT NULL,
  pin_hash text NOT NULL,
  full_name text,
  spin_balance integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  UNIQUE(club_id, member_code)
);

-- Spins
CREATE TABLE spins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  outcome_label text NOT NULL,
  outcome_value integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Wheel configs
CREATE TABLE wheel_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  label text NOT NULL,
  reward_type text NOT NULL,
  reward_value integer DEFAULT 0,
  probability numeric NOT NULL,
  color text,
  active boolean DEFAULT true
);

-- Indexes for tenant-scoped queries
CREATE INDEX idx_clubs_slug ON clubs(slug);
CREATE INDEX idx_clubs_org ON clubs(organization_id);
CREATE INDEX idx_members_club ON members(club_id);
CREATE INDEX idx_members_club_code ON members(club_id, member_code);
CREATE INDEX idx_spins_member ON spins(member_id);
CREATE INDEX idx_spins_club ON spins(club_id);
CREATE INDEX idx_wheel_configs_club ON wheel_configs(club_id);

-- RLS policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_configs ENABLE ROW LEVEL SECURITY;

-- For Phase 1, allow service role full access (onboarding uses admin client).
-- Public read access for clubs/branding (needed for tenant resolution).
CREATE POLICY "Public can read active clubs" ON clubs
  FOR SELECT USING (active = true);

CREATE POLICY "Public can read club branding" ON club_branding
  FOR SELECT USING (true);

CREATE POLICY "Public can read active wheel configs" ON wheel_configs
  FOR SELECT USING (active = true);
