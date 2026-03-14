-- Add optional price to membership periods for public display
ALTER TABLE membership_periods ADD COLUMN price numeric(10,2);
