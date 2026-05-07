-- Private storage bucket for generated legal-membership PDFs.
-- Mirror of member-ids / member-signatures: public: false, no RLS
-- (service-role only), accessed via signed URLs.
-- A typical text-only legal PDF is ~50 KB; the 5 MB cap leaves
-- headroom for embedded signature PNGs and longer legal text blocks.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('member-documents', 'member-documents', false, 5242880, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;
