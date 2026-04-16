-- Defense-in-depth: sell_product now verifies that the staff performing
-- the sale belongs to the same club as the product. Tier A already
-- guarantees this at the server-action layer, but this closes the gap
-- if the RPC is ever called from elsewhere.

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
BEGIN
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

  -- Row-level lock on the product so concurrent sales can't double-spend stock.
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
