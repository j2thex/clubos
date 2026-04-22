-- POS multi-item sales parent.
--
-- Each "sale" is a single staff confirmation that may contain one or more
-- product_transactions rows (cart lines). Discount, comment, and paid_with
-- live on the parent so they apply once per cart, not per line.
--
-- product_transactions.sale_id (added below, nullable) links each line to
-- its parent. Old single-item rows from the previous sell flow keep
-- sale_id NULL until the legacy backfill migration runs, and the
-- transactions UI renders them as one-line legacy entries.

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE RESTRICT NOT NULL,
  fulfilled_by uuid REFERENCES members(id) ON DELETE SET NULL,
  subtotal numeric(10,2) NOT NULL CHECK (subtotal >= 0),
  discount numeric(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  paid_with text NOT NULL CHECK (paid_with IN ('saldo', 'cash')),
  comment text,
  voided_at timestamptz,
  voided_by uuid REFERENCES members(id) ON DELETE SET NULL,
  void_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_club_created
  ON sales(club_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_member_created
  ON sales(member_id, created_at DESC);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages sales"
  ON sales FOR ALL
  USING (auth.role() = 'service_role');

ALTER TABLE product_transactions
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES sales(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_product_transactions_sale
  ON product_transactions(sale_id);

COMMENT ON COLUMN product_transactions.sale_id IS
  'Parent sale (cart) this line belongs to. NULL for legacy single-item rows from before the cart UX.';
