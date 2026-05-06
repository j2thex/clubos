-- Per-club preference: whether the staff/admin nav auto-hides on scroll-down
-- and reappears on scroll-up. Default true (good UX on long pages).
-- When false, nav stays put regardless of scroll direction.

ALTER TABLE clubs
  ADD COLUMN nav_autohide_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN clubs.nav_autohide_enabled IS
  'Auto-hide staff/admin nav on scroll-down and reappear on scroll-up. Default true.';
