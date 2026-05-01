-- Platform-level partners shown on the osocios.club marketing landing.
-- Cross-club (no club_id). Managed from the Tower (/platform-admin).

CREATE TABLE platform_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text NOT NULL,
  website_url text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_partners_order
  ON platform_partners (display_order ASC, created_at ASC);

CREATE INDEX idx_platform_partners_active
  ON platform_partners (active) WHERE active = true;

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_platform_partners_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platform_partners_set_updated_at
  BEFORE UPDATE ON platform_partners
  FOR EACH ROW EXECUTE FUNCTION set_platform_partners_updated_at();

ALTER TABLE platform_partners ENABLE ROW LEVEL SECURITY;

-- Public can read active partners. anon + authenticated.
CREATE POLICY "Public read active platform partners"
  ON platform_partners FOR SELECT
  USING (active = true);

-- Service role manages everything (bypasses RLS automatically; explicit policy
-- documents intent and lets us read inactive rows from the Tower without
-- needing a separate path).
CREATE POLICY "Service role manages platform partners"
  ON platform_partners FOR ALL
  USING (auth.role() = 'service_role');

-- Storage bucket for partner logos. Public read, service-role writes.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'platform-assets',
  'platform-assets',
  true,
  2097152,
  ARRAY['image/png','image/jpeg','image/webp','image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access platform-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'platform-assets');

CREATE POLICY "Service role upload platform-assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'platform-assets');

CREATE POLICY "Service role update platform-assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'platform-assets');

CREATE POLICY "Service role delete platform-assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'platform-assets');
