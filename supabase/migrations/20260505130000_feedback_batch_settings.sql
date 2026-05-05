-- Feedback batch (cards 69f9fd80, 69f9fc85, 69f9f653, 69f9fa59)
-- - clubs.require_referral_code: gates staff manual member-create form
-- - clubs.staff_starting_page: post-login redirect target (allowlist enforced in app code)
-- - members.staff_note: free-text note, surfaced in door/sell/RFID flows
-- - activity_log.ip_address: captured on staff_login action

ALTER TABLE clubs
  ADD COLUMN require_referral_code boolean NOT NULL DEFAULT false,
  ADD COLUMN staff_starting_page text;

ALTER TABLE members
  ADD COLUMN staff_note text;

ALTER TABLE activity_log
  ADD COLUMN ip_address inet;
