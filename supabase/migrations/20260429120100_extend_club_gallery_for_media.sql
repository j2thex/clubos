-- Extend club_gallery to hold images, videos, and audio.
-- Existing rows are images; the DEFAULT backfills them cleanly.
ALTER TABLE club_gallery RENAME COLUMN image_url TO media_url;
ALTER TABLE club_gallery ADD COLUMN media_type text NOT NULL DEFAULT 'image'
  CHECK (media_type IN ('image', 'video', 'audio'));
ALTER TABLE club_gallery ADD COLUMN mime_type text;
