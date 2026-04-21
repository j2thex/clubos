-- Panic lockdown: owner/staff/platform can flip a club into an "offline" state
-- that redirects member and staff traffic to a generic closed page.
-- Staff can only lock; owners and platform admins can unlock.

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by_id uuid,
  ADD COLUMN IF NOT EXISTS locked_by_type text
    CHECK (locked_by_type IS NULL OR locked_by_type IN ('staff', 'owner', 'platform'));

CREATE INDEX IF NOT EXISTS idx_clubs_locked
  ON clubs(locked_at)
  WHERE locked_at IS NOT NULL;

-- Belt-and-suspenders: reject product sales and voids while the club is
-- locked, even if the middleware cache is briefly stale. Re-declares the
-- existing hardened sell_product / void_product_sale bodies verbatim with
-- the new lock guard at the top.

CREATE OR REPLACE FUNCTION sell_product(
  p_club_id uuid,
  p_product_id uuid,
  p_member_id uuid,
  p_staff_id uuid,
  p_quantity numeric,
  p_weight_source text,
  p_scale_raw text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_product products%ROWTYPE;
  v_member_code text;
  v_new_stock numeric(10,3);
  v_total numeric(10,2);
  v_tx_id uuid;
  v_staff_ok boolean;
  v_locked_at timestamptz;
BEGIN
  SELECT locked_at INTO v_locked_at FROM clubs WHERE id = p_club_id;
  IF v_locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'club_locked' USING ERRCODE = 'P0001';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = 'P0001';
  END IF;

  IF p_weight_source NOT IN ('manual', 'scale') THEN
    RAISE EXCEPTION 'invalid_weight_source' USING ERRCODE = 'P0001';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM members WHERE id = p_staff_id AND club_id = p_club_id
  ) INTO v_staff_ok;
  IF NOT v_staff_ok THEN
    RAISE EXCEPTION 'staff_wrong_club' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_product
  FROM products
  WHERE id = p_product_id AND club_id = p_club_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found' USING ERRCODE = 'P0001';
  END IF;

  IF v_product.archived OR NOT v_product.active THEN
    RAISE EXCEPTION 'product_inactive' USING ERRCODE = 'P0001';
  END IF;

  IF v_product.stock_on_hand < p_quantity THEN
    RAISE EXCEPTION 'insufficient_stock' USING ERRCODE = 'P0001';
  END IF;

  SELECT member_code INTO v_member_code
  FROM members
  WHERE id = p_member_id AND club_id = p_club_id;

  IF v_member_code IS NULL THEN
    RAISE EXCEPTION 'member_not_found' USING ERRCODE = 'P0001';
  END IF;

  v_new_stock := v_product.stock_on_hand - p_quantity;
  v_total := ROUND(v_product.unit_price * p_quantity, 2);

  UPDATE products SET stock_on_hand = v_new_stock WHERE id = p_product_id;

  INSERT INTO product_transactions (
    club_id, product_id, member_id, fulfilled_by,
    quantity, unit_price_at_sale, total_price,
    weight_source, scale_raw_reading
  )
  VALUES (
    p_club_id, p_product_id, p_member_id, p_staff_id,
    p_quantity, v_product.unit_price, v_total,
    p_weight_source, p_scale_raw
  )
  RETURNING id INTO v_tx_id;

  INSERT INTO activity_log (club_id, staff_member_id, action, target_member_code, details)
  VALUES (
    p_club_id,
    p_staff_id,
    'product_sale',
    v_member_code,
    format(
      '%s · %s %s · %s €/%s · total %s € · %s',
      v_product.name,
      p_quantity::text,
      CASE WHEN v_product.unit = 'gram' THEN 'g' ELSE 'ea' END,
      v_product.unit_price::text,
      CASE WHEN v_product.unit = 'gram' THEN 'g' ELSE 'ea' END,
      v_total::text,
      p_weight_source
    )
  );

  RETURN v_tx_id;
END;
$$;

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
  v_locked_at timestamptz;
BEGIN
  SELECT locked_at INTO v_locked_at FROM clubs WHERE id = p_club_id;
  IF v_locked_at IS NOT NULL THEN
    RAISE EXCEPTION 'club_locked' USING ERRCODE = 'P0001';
  END IF;

  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RAISE EXCEPTION 'reason_required' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_tx
  FROM product_transactions
  WHERE id = p_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'tx_not_found' USING ERRCODE = 'P0001'; END IF;
  IF v_tx.club_id <> p_club_id THEN RAISE EXCEPTION 'cross_club' USING ERRCODE = 'P0001'; END IF;
  IF v_tx.voided_at IS NOT NULL THEN RAISE EXCEPTION 'already_voided' USING ERRCODE = 'P0001'; END IF;

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
