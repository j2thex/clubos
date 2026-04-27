-- New ops permission: top up a member's saldo balance.
--
-- Separate from can_do_sell so clubs can give cashiers the ability to sell
-- without giving them the keys to add credit (separation of duties when
-- handling cash at the door).
--
-- Defaulting to TRUE preserves today's behavior on migration: every existing
-- staff row gets backfilled to all-capabilities-on. Owners opt individual
-- staff OUT per capability from the admin panel.

ALTER TABLE members
  ADD COLUMN can_do_topup boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN members.can_do_topup IS
  'Staff permission: allowed to add credit to a member''s saldo_balance via topup_saldo RPC. Ignored for is_staff=false.';
