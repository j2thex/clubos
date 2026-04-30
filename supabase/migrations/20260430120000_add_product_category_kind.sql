-- Adds a `kind` discriminator to product_categories so the admin can manage
-- genetics (strains/extracts) separately from drinks & accessories.
-- Existing categories default to 'genetics' to preserve current behavior.

ALTER TABLE product_categories
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'genetics';

ALTER TABLE product_categories
  DROP CONSTRAINT IF EXISTS product_categories_kind_check;

ALTER TABLE product_categories
  ADD CONSTRAINT product_categories_kind_check
  CHECK (kind IN ('genetics', 'drinks_accessories'));

CREATE INDEX IF NOT EXISTS idx_product_categories_club_kind
  ON product_categories(club_id, kind, display_order);
