-- Owner-only manual saldo adjustment.
--
-- Lets the owner correct a balance after a real-world reconciliation
-- mistake. The RPC itself does not enforce the owner check — that lives
-- in the server action layer (requireOwnerForClub) — but a club_id +
-- staff_id are still required for the audit trail.
--
-- Signed amount: positive = credit, negative = debit. The base CHECK
-- (saldo_balance >= 0) on members guards against pushing the balance
-- below zero; the RPC raises 'would_go_negative' first with a friendly
-- code so the UI can show "Reduce by at most X €".
--
-- Returns jsonb { balance_after }.
--
-- Error codes (all P0001):
--   invalid_amount, would_go_negative, member_not_found,
--   wrong_currency_mode, comment_required

CREATE OR REPLACE FUNCTION admin_adjust_saldo(
  p_club_id uuid,
  p_member_id uuid,
  p_amount numeric,
  p_comment text,
  p_staff_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_currency_mode text;
  v_member_code text;
  v_current numeric(10,2);
  v_balance_after numeric(10,2);
BEGIN
  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'invalid_amount' USING ERRCODE = 'P0001';
  END IF;

  IF p_comment IS NULL OR length(trim(p_comment)) = 0 THEN
    RAISE EXCEPTION 'comment_required' USING ERRCODE = 'P0001';
  END IF;

  SELECT currency_mode INTO v_currency_mode FROM clubs WHERE id = p_club_id;
  IF v_currency_mode IS NULL THEN
    RAISE EXCEPTION 'club_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF v_currency_mode <> 'saldo' THEN
    RAISE EXCEPTION 'wrong_currency_mode' USING ERRCODE = 'P0001';
  END IF;

  SELECT member_code, saldo_balance
  INTO v_member_code, v_current
  FROM members
  WHERE id = p_member_id AND club_id = p_club_id
  FOR UPDATE;

  IF v_member_code IS NULL THEN
    RAISE EXCEPTION 'member_not_found' USING ERRCODE = 'P0001';
  END IF;

  v_balance_after := v_current + p_amount;
  IF v_balance_after < 0 THEN
    RAISE EXCEPTION 'would_go_negative' USING ERRCODE = 'P0001';
  END IF;

  UPDATE members SET saldo_balance = v_balance_after WHERE id = p_member_id;

  INSERT INTO member_saldo_transactions (
    club_id, member_id, type, amount, balance_after,
    sale_id, method, comment, created_by
  )
  VALUES (
    p_club_id, p_member_id, 'admin_adjustment', p_amount, v_balance_after,
    NULL, NULL, trim(p_comment), p_staff_id
  );

  INSERT INTO activity_log (club_id, staff_member_id, action, target_member_code, details)
  VALUES (
    p_club_id,
    p_staff_id,
    'saldo_admin_adjustment',
    v_member_code,
    format(
      '%s%s € · balance %s € · reason: %s',
      CASE WHEN p_amount >= 0 THEN '+' ELSE '' END,
      p_amount::text,
      v_balance_after::text,
      trim(p_comment)
    )
  );

  RETURN jsonb_build_object('balance_after', v_balance_after);
END;
$$;
