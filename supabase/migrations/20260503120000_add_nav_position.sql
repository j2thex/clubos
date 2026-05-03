-- Per-club preference for staff/admin navigation position.
-- 'bottom' (default) preserves current fixed-bottom nav.
-- 'top' renders a single merged top bar combining header utilities + nav items.

ALTER TABLE clubs
  ADD COLUMN nav_position text NOT NULL DEFAULT 'bottom'
  CHECK (nav_position IN ('bottom', 'top'));

COMMENT ON COLUMN clubs.nav_position IS
  'Navigation position for staff console and admin panel. bottom = fixed bottom bar (default); top = merged top bar.';
