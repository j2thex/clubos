-- Cards 69f9f6a8 (legal PDF) + 69f9fc55 (flexible permissions)
-- - clubs.legal_membership_text: per-club consent text shown on the generated PDF
-- - members.legal_pdf_path: storage path of the signed legal document (member-documents bucket)
-- - members.can_manage_products: gate for staff product/stock mutations
-- - members.can_manage_identity: gate for staff ID-verify + identity-edit actions

ALTER TABLE clubs
  ADD COLUMN legal_membership_text text;

ALTER TABLE members
  ADD COLUMN legal_pdf_path text,
  ADD COLUMN can_manage_products boolean NOT NULL DEFAULT true,
  ADD COLUMN can_manage_identity boolean NOT NULL DEFAULT true;
