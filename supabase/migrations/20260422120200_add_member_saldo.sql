-- Member saldo (prepaid credit balance) for clubs in saldo currency mode.
--
-- Stored as a denormalized cache; the source of truth is the
-- member_saldo_transactions ledger (created in a follow-on migration).
-- Maintained atomically by the topup_saldo / record_sale / void_sale /
-- admin_adjust_saldo RPCs, which all SELECT FOR UPDATE on the member row
-- before mutating to prevent two stations double-spending.
--
-- CHECK >= 0 enforces no overdrafts at the storage layer; the RPCs raise
-- 'insufficient_saldo' before reaching this check.

ALTER TABLE members
  ADD COLUMN saldo_balance numeric(10,2) NOT NULL DEFAULT 0.00
  CHECK (saldo_balance >= 0);

COMMENT ON COLUMN members.saldo_balance IS
  'Prepaid credit balance for saldo-mode clubs. Mutated only via RPC; ledger in member_saldo_transactions.';
