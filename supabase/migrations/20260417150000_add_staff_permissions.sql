-- Per-staff ops permissions.
--
-- Today any member with is_staff=true on an ops-enabled club can do every
-- ops action (admit at the door, record a sale, void a sale, see the log).
-- These three flags let the owner scope each staff member's capabilities.
--
-- Columns apply only when is_staff=true. They are meaningless noise for
-- regular members but are cheap (three bools) and avoid a separate table.
--
-- Defaulting to TRUE preserves today's behavior on migration: every
-- existing staff row gets backfilled to all-capabilities-on. Owners
-- opt individual staff OUT per capability from the admin panel.

ALTER TABLE members
  ADD COLUMN can_do_entry boolean NOT NULL DEFAULT true,
  ADD COLUMN can_do_sell boolean NOT NULL DEFAULT true,
  ADD COLUMN can_do_transactions boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN members.can_do_entry IS
  'Staff permission: allowed to use /staff/operations/entry (door/admission). Ignored for is_staff=false.';
COMMENT ON COLUMN members.can_do_sell IS
  'Staff permission: allowed to use /staff/operations/sell (record a product sale). Ignored for is_staff=false.';
COMMENT ON COLUMN members.can_do_transactions IS
  'Staff permission: allowed to view /staff/operations/transactions and void sales. Ignored for is_staff=false.';
