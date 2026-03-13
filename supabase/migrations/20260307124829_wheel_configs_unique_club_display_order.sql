-- Unique constraint on wheel_configs display_order per club
ALTER TABLE wheel_configs ADD UNIQUE (club_id, display_order);
CREATE UNIQUE INDEX idx_wheel_configs_club_order ON wheel_configs(club_id, display_order) WHERE active = true;
