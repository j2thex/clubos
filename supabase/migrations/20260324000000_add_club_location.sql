-- Add location fields to clubs for map-based discover page
ALTER TABLE clubs ADD COLUMN latitude double precision;
ALTER TABLE clubs ADD COLUMN longitude double precision;
ALTER TABLE clubs ADD COLUMN address text;
ALTER TABLE clubs ADD COLUMN city text;
ALTER TABLE clubs ADD COLUMN country text;

CREATE INDEX idx_clubs_location ON clubs (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
