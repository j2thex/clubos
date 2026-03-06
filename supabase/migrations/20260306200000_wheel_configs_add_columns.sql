-- Add display_order and label_color to wheel_configs
ALTER TABLE wheel_configs ADD COLUMN display_order integer DEFAULT 0;
ALTER TABLE wheel_configs ADD COLUMN label_color text DEFAULT '#ffffff';
