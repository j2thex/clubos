-- Seed data for staging and local development
-- Run via: supabase db reset (local) or psql against staging

-- Test organization
INSERT INTO organizations (id, name, slug) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test Org', 'test-org')
ON CONFLICT (slug) DO NOTHING;

-- Demo club
INSERT INTO clubs (id, organization_id, name, slug, timezone, currency) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Demo Club', 'demo', 'Europe/Madrid', 'EUR')
ON CONFLICT (slug) DO NOTHING;

-- Club branding
INSERT INTO club_branding (club_id, primary_color, secondary_color, hero_content) VALUES
  ('00000000-0000-0000-0000-000000000010', '#16a34a', '#052e16', 'Welcome to Demo Club! Test all features here.')
ON CONFLICT (club_id) DO NOTHING;

-- Test member (login with code: TEST01)
INSERT INTO members (id, club_id, member_code, full_name, spin_balance, status, is_staff) VALUES
  ('00000000-0000-0000-0000-000000000100', '00000000-0000-0000-0000-000000000010', 'TEST01', 'Test Member', 5, 'active', false)
ON CONFLICT (club_id, member_code) DO NOTHING;

-- Test staff (login with code: STAFF1, PIN: 1234)
-- pin_hash is bcrypt of "1234"
INSERT INTO members (id, club_id, member_code, pin_hash, full_name, spin_balance, status, is_staff) VALUES
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000010', 'STAFF1', '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQStf1vNp1t3ePpahIbFDl57kI5bVi', 'Test Staff', 3, 'active', true)
ON CONFLICT (club_id, member_code) DO NOTHING;

-- Expired test member (login with code: EXPRD1)
INSERT INTO members (id, club_id, member_code, full_name, spin_balance, status, is_staff, valid_till) VALUES
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000010', 'EXPRD1', 'Expired Member', 0, 'active', false, '2025-01-01')
ON CONFLICT (club_id, member_code) DO NOTHING;

-- Wheel configs
INSERT INTO wheel_configs (club_id, label, reward_type, reward_value, probability, color, display_order, label_color, active) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Free Drink', 'prize', 1, 0.2, '#22c55e', 0, '#ffffff', true),
  ('00000000-0000-0000-0000-000000000010', 'Try Again', 'nothing', 0, 0.5, '#ef4444', 1, '#ffffff', true),
  ('00000000-0000-0000-0000-000000000010', '10 Points', 'points', 10, 0.3, '#3b82f6', 2, '#ffffff', true)
ON CONFLICT (club_id, display_order) DO NOTHING;

-- Sample quest
INSERT INTO quests (club_id, title, description, reward_spins, active, display_order, is_public) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Follow us on Instagram', 'Follow our Instagram page for updates', 1, true, 0, true)
ON CONFLICT DO NOTHING;

-- Sample event (future date)
INSERT INTO events (club_id, title, description, date, time, reward_spins, active, is_public) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Weekly Meetup', 'Join us every Friday!', CURRENT_DATE + INTERVAL '7 days', '20:00', 1, true, true)
ON CONFLICT DO NOTHING;

-- Sample service
INSERT INTO services (club_id, title, description, price, active, display_order, is_public) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Premium Locker', 'Personal locker for one month', 10.00, true, 0, true)
ON CONFLICT DO NOTHING;
