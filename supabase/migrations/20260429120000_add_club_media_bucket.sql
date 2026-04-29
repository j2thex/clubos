-- Dedicated bucket for club gallery media (images, videos, audio).
-- Kept separate from club-images so loosening the MIME allowlist doesn't
-- bleed into quests/services that still call uploadClubImage.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'club-media',
  'club-media',
  true,
  52428800,
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'video/mp4','video/quicktime','video/webm',
    'audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm'
  ]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access club-media" ON storage.objects FOR SELECT USING (bucket_id = 'club-media');
CREATE POLICY "Service role upload club-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'club-media');
CREATE POLICY "Service role update club-media" ON storage.objects FOR UPDATE USING (bucket_id = 'club-media');
CREATE POLICY "Service role delete club-media" ON storage.objects FOR DELETE USING (bucket_id = 'club-media');
