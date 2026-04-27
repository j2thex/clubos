-- Atomic top-up: add credit to a member's saldo balance.
--
-- Locks the member row, validates the amount is positive, increments
-- saldo_balance, writes a 'topup' ledger row, and writes activity_log —
-- all in one transaction.
--
-- p_method is a free-text label captured from the staff form (typically
-- one of 'cash', 'transfer', 'bizum', 'other'). Stored verbatim.
--
-- Returns jsonb { balance_after }.
--
-- Error codes (all P0001):
--   invalid_amount, staff_wrong_club, member_not_found, wrong_currency_mode

CREATE OR REPLACE FUNCTION topup_saldo(
  p_club_id uuid,
  p_member_id uuid,
  p_amount numeric,
  p_method text,
  p_comment text,
  p_staff_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_currency_mode text;
  v_staff_ok boolean;
  v_member_code text;
  v_balance_after numeric(10,2);
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid_amount' USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM members WHERE id = p_staff_id AND club_id = p_club_id
  ) INTO v_staff_ok;
  IF NOT v_staff_ok THEN
    RAISE EXCEPTION 'staff_wrong_club' USING ERRCODE = 'P0001';
  END IF;

  SELECT currency_mode INTO v_currency_mode FROM clubs WHERE id = p_club_id;
  IF v_currency_mode IS NULL THEN
    RAISE EXCEPTION 'club_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF v_currency_mode <> 'saldo' THEN
    RAISE EXCEPTION 'wrong_currency_mode' USING ERRCODE = 'P0001';
  END IF;

  -- Lock the member row before mutating balance.
  SELECT member_code, saldo_balance + p_amount
  INTO v_member_code, v_balance_after
  FROM members
  WHERE id = p_member_id AND club_id = p_club_id
  FOR UPDATE;

  IF v_member_code IS NULL THEN
    RAISE EXCEPTION 'member_not_found' USING ERRCODE = 'P0001';
  END IF;

  UPDATE members SET saldo_balance = v_balance_after WHERE id = p_member_id;

  INSERT INTO member_saldo_transactions (
    club_id, member_id, type, amount, balance_after,
    sale_id, method, comment, created_by
  )
  VALUES (
    p_club_id, p_member_id, 'topup', p_amount, v_balance_after,
    NULL, NULLIF(trim(COALESCE(p_method, '')), ''),
    NULLIF(trim(COALESCE(p_comment, '')), ''), p_staff_id
  );

  INSERT INTO activity_log (club_id, staff_member_id, action, target_member_code, details)
  VALUES (
    p_club_id,
    p_staff_id,
    'saldo_topup',
    v_member_code,
    format(
      '+%s € via %s · balance %s €',
      p_amount::text,
      COALESCE(NULLIF(trim(COALESCE(p_method, '')), ''), 'unspecified'),
      v_balance_after::text
    )
  );

  RETURN jsonb_build_object('balance_after', v_balance_after);
END;
$$;
