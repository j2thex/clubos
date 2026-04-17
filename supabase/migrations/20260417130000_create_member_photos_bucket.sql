-- Private storage bucket for member portrait photos (head-and-shoulders, taken at onboarding).
-- Mirror of member-ids: public: false, service-role-only (no RLS policies),
-- all client reads go through server-generated signed URLs.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('member-photos', 'member-photos', false, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/heic'])
ON CONFLICT (id) DO NOTHING;
