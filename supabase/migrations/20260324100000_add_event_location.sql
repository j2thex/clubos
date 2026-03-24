-- Add location fields to events for map-based discover page
ALTER TABLE events ADD COLUMN latitude double precision;
ALTER TABLE events ADD COLUMN longitude double precision;
ALTER TABLE events ADD COLUMN location_name text;
