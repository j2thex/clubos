-- Allow activity_log entries to reference a specific product so the admin can
-- show a per-product timeline (sales, stock adjustments, edits, archive).

ALTER TABLE activity_log
  ADD COLUMN IF NOT EXISTS target_product_id uuid REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activity_log_target_product
  ON activity_log(target_product_id, created_at DESC)
  WHERE target_product_id IS NOT NULL;
