-- Private storage bucket for member signatures (PNG exports from canvas or Signotec pad).
-- Mirror of member-ids / member-photos: public: false, no RLS (service-role only).
-- Signatures are small monochrome PNGs — 500 KB cap is generous.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('member-signatures', 'member-signatures', false, 524288, ARRAY['image/png'])
ON CONFLICT (id) DO NOTHING;
