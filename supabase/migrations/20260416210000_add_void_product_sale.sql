-- Atomic void: locks the transaction and its product row, restores stock,
-- stamps the void fields, and writes the audit row — all in one transaction.
-- Replaces the non-atomic read-then-write path in voidTransaction(action.ts).

CREATE OR REPLACE FUNCTION void_product_sale(
  p_transaction_id uuid,
  p_club_id uuid,
  p_staff_id uuid,
  p_reason text
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_tx product_transactions%ROWTYPE;
  v_product products%ROWTYPE;
  v_member_code text;
BEGIN
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = 'P0001';
  END IF;

  -- Lock the transaction row while we restore stock and mark it voided.
  SELECT * INTO v_tx
  FROM product_transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'tx_not_found' USING ERRCODE = 'P0001'; END IF;
  IF v_tx.club_id <> p_club_id THEN RAISE EXCEPTION 'cross_club' USING ERRCODE = 'P0001'; END IF;
  IF v_tx.voided_at IS NOT NULL THEN RAISE EXCEPTION 'already_voided' USING ERRCODE = 'P0001'; END IF;

  -- Lock the product row too — serializes with any in-flight sell_product.
  SELECT * INTO v_product
  FROM products
  WHERE id = v_tx.product_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'product_missing' USING ERRCODE = 'P0001'; END IF;

  UPDATE products
    SET stock_on_hand = stock_on_hand + v_tx.quantity
    WHERE id = v_tx.product_id;

  UPDATE product_transactions
    SET voided_at = now(),
        voided_by = p_staff_id,
        void_reason = p_reason
    WHERE id = p_transaction_id;

  SELECT member_code INTO v_member_code
  FROM members
  WHERE id = v_tx.member_id;

  INSERT INTO activity_log (club_id, staff_member_id, action, target_member_code, details)
  VALUES (
    p_club_id,
    p_staff_id,
    'product_sale_voided',
    v_member_code,
    format('%s · qty %s restored · reason: %s', v_product.name, v_tx.quantity::text, p_reason)
  );
END;
$$;
