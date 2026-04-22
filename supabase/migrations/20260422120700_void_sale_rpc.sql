-- Atomic void of a multi-line sale.
--
-- Locks the parent sale and each line, restores stock for every line,
-- stamps voided_at/by/reason on parent + lines, and (saldo only) refunds
-- the member balance and writes a 'refund' ledger row — all in one txn.
--
-- The legacy void_product_sale() RPC is kept as-is for old single-item
-- product_transactions rows where sale_id IS NULL.
--
-- Returns jsonb { sale_id, refunded, balance_after } where:
--   refunded     = the amount put back on the balance (0 for cash sales)
--   balance_after = new balance for saldo, NULL for cash
--
-- Error codes (all P0001):
--   reason_required, sale_not_found, cross_club, already_voided

CREATE OR REPLACE FUNCTION void_sale(
  p_sale_id uuid,
  p_club_id uuid,
  p_staff_id uuid,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_sale sales%ROWTYPE;
  v_member_code text;
  v_member_balance numeric(10,2);
  v_balance_after numeric(10,2);
  v_line product_transactions%ROWTYPE;
  v_line_count integer := 0;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = 'P0001';
  END IF;

  -- Lock the parent sale.
  SELECT * INTO v_sale FROM sales WHERE id = p_sale_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'sale_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF v_sale.club_id <> p_club_id THEN
    RAISE EXCEPTION 'cross_club' USING ERRCODE = 'P0001';
  END IF;
  IF v_sale.voided_at IS NOT NULL THEN
    RAISE EXCEPTION 'already_voided' USING ERRCODE = 'P0001';
  END IF;

  -- Lock and restore each line.
  FOR v_line IN
    SELECT * FROM product_transactions
    WHERE sale_id = p_sale_id
    ORDER BY id
    FOR UPDATE
  LOOP
    -- Lock the product row so stock restore serializes with in-flight sells.
    PERFORM 1 FROM products WHERE id = v_line.product_id FOR UPDATE;

    UPDATE products
      SET stock_on_hand = stock_on_hand + v_line.quantity
      WHERE id = v_line.product_id;

    UPDATE product_transactions
      SET voided_at = now(),
          voided_by = p_staff_id,
          void_reason = p_reason
      WHERE id = v_line.id;

    v_line_count := v_line_count + 1;
  END LOOP;

  -- Stamp the parent.
  UPDATE sales
    SET voided_at = now(),
        voided_by = p_staff_id,
        void_reason = p_reason
    WHERE id = p_sale_id;

  -- Saldo refund (if applicable).
  IF v_sale.paid_with = 'saldo' THEN
    SELECT member_code, saldo_balance + v_sale.total
    INTO v_member_code, v_balance_after
    FROM members
    WHERE id = v_sale.member_id
    FOR UPDATE;

    UPDATE members SET saldo_balance = v_balance_after WHERE id = v_sale.member_id;

    INSERT INTO member_saldo_transactions (
      club_id, member_id, type, amount, balance_after,
      sale_id, method, comment, created_by
    )
    VALUES (
      p_club_id, v_sale.member_id, 'refund', v_sale.total, v_balance_after,
      p_sale_id, NULL, format('Void: %s', p_reason), p_staff_id
    );
  ELSE
    SELECT member_code INTO v_member_code FROM members WHERE id = v_sale.member_id;
    v_balance_after := NULL;
  END IF;

  INSERT INTO activity_log (club_id, staff_member_id, action, target_member_code, details)
  VALUES (
    p_club_id,
    p_staff_id,
    'product_sale_voided',
    v_member_code,
    format(
      '%s line(s) restored · total %s € · %s · reason: %s',
      v_line_count::text,
      v_sale.total::text,
      v_sale.paid_with,
      p_reason
    )
  );

  RETURN jsonb_build_object(
    'sale_id', p_sale_id,
    'refunded', CASE WHEN v_sale.paid_with = 'saldo' THEN v_sale.total ELSE 0 END,
    'balance_after', v_balance_after
  );
END;
$$;
