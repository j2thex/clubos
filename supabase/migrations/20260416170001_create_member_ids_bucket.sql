-- Private storage bucket for member ID photos (cannabis-club age verification).
-- public: false → no public URL endpoint.
-- No RLS policies → only the service role (server-side admin client) bypasses RLS.
-- Authenticated and anon clients cannot read/write these objects directly.
-- All client reads must go through server-generated signed URLs (createSignedUrl).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('member-ids', 'member-ids', false, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/heic'])
ON CONFLICT (id) DO NOTHING;
