-- Storage bucket for member-uploaded proof screenshots (google review proof, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('quest-proofs', 'quest-proofs', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Quest proofs public read" ON storage.objects FOR SELECT USING (bucket_id = 'quest-proofs');
CREATE POLICY "Quest proofs service role upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'quest-proofs');
CREATE POLICY "Quest proofs service role delete" ON storage.objects FOR DELETE USING (bucket_id = 'quest-proofs');
