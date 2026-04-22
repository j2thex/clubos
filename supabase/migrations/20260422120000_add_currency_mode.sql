-- POS currency mode per club.
--
-- 'cash'  = current behavior. Sales are recorded but no balance is touched.
-- 'saldo' = cannabis-association style. Members must top up first; sales
--           deduct from members.saldo_balance and are blocked when the
--           balance would go negative.
--
-- Default 'cash' so every existing club keeps its current behavior on migrate.

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS currency_mode text NOT NULL DEFAULT 'cash'
  CHECK (currency_mode IN ('saldo', 'cash'));

COMMENT ON COLUMN clubs.currency_mode IS
  'POS payment model: cash = direct-pay, saldo = prepaid credit balance.';
