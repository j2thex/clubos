-- Member saldo ledger — append-only audit of every credit movement.
--
-- Source of truth for the balance. members.saldo_balance is a denormalized
-- cache kept in sync by the same RPCs that insert here.
--
-- Type semantics:
--   topup             — staff added credit (amount > 0). method = how (cash/transfer/...)
--   sale              — credit drawn down by a sale (amount < 0). sale_id set.
--   refund            — voided sale re-credited the balance (amount > 0). sale_id set.
--   admin_adjustment  — owner manual correction (amount signed either way).
--
-- balance_after captures the post-write balance for fast lookback without
-- replaying the whole ledger.

CREATE TABLE IF NOT EXISTS member_saldo_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE RESTRICT NOT NULL,
  type text NOT NULL CHECK (type IN ('topup', 'sale', 'refund', 'admin_adjustment')),
  amount numeric(10,2) NOT NULL,
  balance_after numeric(10,2) NOT NULL CHECK (balance_after >= 0),
  sale_id uuid REFERENCES sales(id) ON DELETE SET NULL,
  method text,
  comment text,
  created_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_saldo_tx_club_created
  ON member_saldo_transactions(club_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_saldo_tx_member_created
  ON member_saldo_transactions(member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_member_saldo_tx_sale
  ON member_saldo_transactions(sale_id);

ALTER TABLE member_saldo_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages member saldo transactions"
  ON member_saldo_transactions FOR ALL
  USING (auth.role() = 'service_role');
