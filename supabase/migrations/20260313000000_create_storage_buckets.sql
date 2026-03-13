-- Create storage buckets for image uploads (previously created manually in dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('club-images', 'club-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']),
  ('event-images', 'event-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id IN ('club-images', 'event-images'));
CREATE POLICY "Service role upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('club-images', 'event-images'));
CREATE POLICY "Service role update" ON storage.objects FOR UPDATE USING (bucket_id IN ('club-images', 'event-images'));
CREATE POLICY "Service role delete" ON storage.objects FOR DELETE USING (bucket_id IN ('club-images', 'event-images'));
