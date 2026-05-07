-- Adds audit fields and a sale-level scale flag for the scale-confirmed sell flow.
--
-- product_transactions.weight_requested  — staff-stated grams target (or grams
--   computed from a price-mode entry). null for piece products and legacy rows.
-- product_transactions.price_input       — €amount staff entered when selling
--   "for €X". null for weight-mode and piece sales.
-- sales.scale_used                       — true iff at least one line in the
--   sale was confirmed via the scale. Denormalised so the admin filter is a
--   single-column predicate (no aggregation).

ALTER TABLE product_transactions
  ADD COLUMN IF NOT EXISTS weight_requested numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_input numeric(10,2);

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS scale_used boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS sales_club_scale_used_created_idx
  ON sales (club_id, scale_used, created_at DESC);
