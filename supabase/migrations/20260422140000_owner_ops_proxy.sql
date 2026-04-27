-- Owner ops proxy + activity-log owner attribution.
--
-- Admins (club_owners, email+password) need to perform ops actions
-- (admit, sell, void, top-up, etc.) from the admin panel the same way
-- staff do today. Ops RPCs (record_sale, topup_saldo, void_sale,
-- void_product_sale) require a uuid FK into members for p_staff_id,
-- and tables like sales/club_entries have FK columns (fulfilled_by,
-- checked_in_by, etc.) into members. Owners have no members row.
--
-- Rather than relaxing those FKs across many tables and RPCs, we give
-- each owner a synthetic "owner-proxy" member row, one per (owner, club).
-- It holds is_staff=true + all can_do_* flags, and its owner_id column
-- links back to the originating owner. Admin member lists filter
-- owner_id IS NULL so proxy rows stay hidden from People views.
--
-- For cleaner audit filtering, activity_log also gets actor_owner_id
-- alongside the existing staff_member_id so we can answer "what did
-- owner X do?" without joining through the proxy member.

ALTER TABLE members
  ADD COLUMN owner_id uuid REFERENCES club_owners(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_members_owner_per_club
  ON members(owner_id, club_id)
  WHERE owner_id IS NOT NULL;

COMMENT ON COLUMN members.owner_id IS
  'Non-null on synthetic owner-proxy rows used to attribute admin-performed ops actions. Hidden from admin member lists.';

ALTER TABLE activity_log
  ADD COLUMN actor_owner_id uuid REFERENCES club_owners(id) ON DELETE SET NULL;

COMMENT ON COLUMN activity_log.actor_owner_id IS
  'Set when an ops action was performed by a logged-in admin/owner. NULL for staff-performed actions.';
