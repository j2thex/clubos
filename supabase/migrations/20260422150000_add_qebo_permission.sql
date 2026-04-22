-- New content permission: manage Quests, Events, Bonuses (spin-prize approvals),
-- and Offers from the staff console.
--
-- Symmetric with can_do_entry / can_do_sell / can_do_topup / can_do_transactions:
-- a single boolean on members that the club owner toggles per staff from the
-- admin People panel. When off, the four QEBO nav items are hidden and the
-- corresponding /staff routes return a NoAccessCard.
--
-- Defaulting to TRUE preserves today's behavior on migration: every existing
-- staff row keeps access to Bonuses / Quests / Events / Offers. Owners opt
-- individual staff OUT per capability from the admin panel.

ALTER TABLE members
  ADD COLUMN can_do_qebo boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN members.can_do_qebo IS
  'Staff permission: allowed to access Quests approval, Events, Bonuses (spin prizes), and Offers from the staff console. Ignored for is_staff=false.';
