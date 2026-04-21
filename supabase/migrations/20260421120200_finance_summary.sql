-- Finance dashboard: per-day × per-product rollup of product_transactions
-- for a date range. One round-trip powers all tiles/charts on the admin
-- Finance page (revenue, margin, category breakdown, top products).
--
-- Timezone is hardcoded to Europe/Madrid for now; all current ops clubs
-- are there. When a second timezone appears, add clubs.timezone and pass in.

CREATE INDEX IF NOT EXISTS idx_product_transactions_club_created_notvoid
  ON product_transactions(club_id, created_at)
  WHERE voided_at IS NULL;

CREATE OR REPLACE FUNCTION finance_summary(
  p_club_id uuid,
  p_from timestamptz,
  p_to timestamptz
) RETURNS TABLE (
  day date,
  category_id uuid,
  category_name text,
  product_id uuid,
  product_name text,
  qty numeric,
  gross numeric,
  cost numeric,
  voided_gross numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    date_trunc('day', t.created_at AT TIME ZONE 'Europe/Madrid')::date AS day,
    p.category_id,
    c.name AS category_name,
    p.id AS product_id,
    p.name AS product_name,
    COALESCE(SUM(CASE WHEN t.voided_at IS NULL THEN t.quantity ELSE 0 END), 0) AS qty,
    COALESCE(SUM(CASE WHEN t.voided_at IS NULL THEN t.total_price ELSE 0 END), 0) AS gross,
    COALESCE(SUM(CASE WHEN t.voided_at IS NULL THEN t.quantity * COALESCE(p.cost_price, 0) ELSE 0 END), 0) AS cost,
    COALESCE(SUM(CASE WHEN t.voided_at IS NOT NULL THEN t.total_price ELSE 0 END), 0) AS voided_gross
  FROM product_transactions t
  JOIN products p ON p.id = t.product_id
  LEFT JOIN product_categories c ON c.id = p.category_id
  WHERE t.club_id = p_club_id
    AND t.created_at >= p_from
    AND t.created_at < p_to
  GROUP BY 1, 2, 3, 4, 5;
$$;

GRANT EXECUTE ON FUNCTION finance_summary(uuid, timestamptz, timestamptz) TO service_role;
