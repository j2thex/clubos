-- Allow HEIC/HEIF in club-images and event-images buckets so iOS uploads stop
-- silently failing. iOS Camera default is HEIC; without this, the bucket
-- rejects the upload and the admin sees a generic "Failed to upload image".
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/heic',
  'image/heif'
]
WHERE id IN ('club-images', 'event-images');
