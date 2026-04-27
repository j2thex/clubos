-- Atomic multi-line sale.
--
-- p_lines is a JSON array of cart lines. Each line is an object:
--   { product_id: uuid, quantity: numeric, weight_source: 'manual'|'scale', scale_raw: text? }
--
-- Order of operations (all in one transaction):
--   1. Validate inputs and staff∈club guard.
--   2. Validate club currency_mode matches p_paid_with.
--   3. If saldo: SELECT FOR UPDATE on members row first (prevents two
--      stations double-spending the same balance).
--   4. Loop lines: SELECT FOR UPDATE on each product, validate active+stock,
--      accumulate subtotal.
--   5. Validate discount within bounds; compute total.
--   6. If saldo and balance < total → raise insufficient_saldo.
--   7. INSERT sales (parent), get sale_id.
--   8. Loop lines again: INSERT product_transactions with sale_id, decrement stock.
--   9. If saldo: UPDATE members.saldo_balance -= total; INSERT ledger row.
--  10. Single summary INSERT into activity_log.
--
-- Returns jsonb { sale_id, total, balance_after } where balance_after is
-- the new balance for saldo mode, or NULL for cash mode.
--
-- Error codes (all P0001):
--   empty_cart, invalid_lines, invalid_quantity, invalid_weight_source,
--   wrong_currency_mode, staff_wrong_club, member_not_found,
--   product_not_found, product_inactive, insufficient_stock,
--   discount_too_large, insufficient_saldo

CREATE OR REPLACE FUNCTION record_sale(
  p_club_id uuid,
  p_member_id uuid,
  p_staff_id uuid,
  p_lines jsonb,
  p_discount numeric,
  p_comment text,
  p_paid_with text
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_currency_mode text;
  v_staff_ok boolean;
  v_member_code text;
  v_member_balance numeric(10,2);
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2);
  v_total numeric(10,2);
  v_balance_after numeric(10,2);
  v_sale_id uuid;
  v_line jsonb;
  v_product_id uuid;
  v_quantity numeric;
  v_weight_source text;
  v_scale_raw text;
  v_product products%ROWTYPE;
  v_line_total numeric(10,2);
  v_line_count integer := 0;
BEGIN
  -- 1. Input shape
  IF p_paid_with NOT IN ('saldo', 'cash') THEN
    RAISE EXCEPTION 'invalid_paid_with' USING ERRCODE = 'P0001';
  END IF;

  IF p_lines IS NULL OR jsonb_typeof(p_lines) <> 'array' THEN
    RAISE EXCEPTION 'invalid_lines' USING ERRCODE = 'P0001';
  END IF;

  IF jsonb_array_length(p_lines) = 0 THEN
    RAISE EXCEPTION 'empty_cart' USING ERRCODE = 'P0001';
  END IF;

  v_discount := COALESCE(p_discount, 0);
  IF v_discount < 0 THEN
    RAISE EXCEPTION 'discount_too_large' USING ERRCODE = 'P0001';
  END IF;

  -- 2. Staff∈club guard
  SELECT EXISTS (
    SELECT 1 FROM members WHERE id = p_staff_id AND club_id = p_club_id
  ) INTO v_staff_ok;
  IF NOT v_staff_ok THEN
    RAISE EXCEPTION 'staff_wrong_club' USING ERRCODE = 'P0001';
  END IF;

  -- 3. Currency mode must match
  SELECT currency_mode INTO v_currency_mode FROM clubs WHERE id = p_club_id;
  IF v_currency_mode IS NULL THEN
    RAISE EXCEPTION 'club_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF v_currency_mode <> p_paid_with THEN
    RAISE EXCEPTION 'wrong_currency_mode' USING ERRCODE = 'P0001';
  END IF;

  -- 4. Lock the member row (saldo mode) and resolve member_code (both modes)
  IF p_paid_with = 'saldo' THEN
    SELECT member_code, saldo_balance INTO v_member_code, v_member_balance
    FROM members
    WHERE id = p_member_id AND club_id = p_club_id
    FOR UPDATE;
  ELSE
    SELECT member_code INTO v_member_code
    FROM members
    WHERE id = p_member_id AND club_id = p_club_id;
    v_member_balance := NULL;
  END IF;

  IF v_member_code IS NULL THEN
    RAISE EXCEPTION 'member_not_found' USING ERRCODE = 'P0001';
  END IF;

  -- 5. Lock each product, validate, accumulate subtotal
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_quantity := (v_line ->> 'quantity')::numeric;
    v_weight_source := COALESCE(v_line ->> 'weight_source', 'manual');

    IF v_product_id IS NULL THEN
      RAISE EXCEPTION 'invalid_lines' USING ERRCODE = 'P0001';
    END IF;
    IF v_quantity IS NULL OR v_quantity <= 0 THEN
      RAISE EXCEPTION 'invalid_quantity' USING ERRCODE = 'P0001';
    END IF;
    IF v_weight_source NOT IN ('manual', 'scale') THEN
      RAISE EXCEPTION 'invalid_weight_source' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_product
    FROM products
    WHERE id = v_product_id AND club_id = p_club_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'product_not_found' USING ERRCODE = 'P0001';
    END IF;
    IF v_product.archived OR NOT v_product.active THEN
      RAISE EXCEPTION 'product_inactive' USING ERRCODE = 'P0001';
    END IF;
    IF v_product.stock_on_hand < v_quantity THEN
      RAISE EXCEPTION 'insufficient_stock' USING ERRCODE = 'P0001';
    END IF;

    v_line_total := ROUND(v_product.unit_price * v_quantity, 2);
    v_subtotal := v_subtotal + v_line_total;
    v_line_count := v_line_count + 1;
  END LOOP;

  -- 6. Discount + total
  IF v_discount > v_subtotal THEN
    RAISE EXCEPTION 'discount_too_large' USING ERRCODE = 'P0001';
  END IF;
  v_total := v_subtotal - v_discount;

  -- 7. Saldo sufficiency
  IF p_paid_with = 'saldo' AND v_member_balance < v_total THEN
    RAISE EXCEPTION 'insufficient_saldo' USING ERRCODE = 'P0001';
  END IF;

  -- 8. Insert parent sale
  INSERT INTO sales (
    club_id, member_id, fulfilled_by,
    subtotal, discount, total,
    paid_with, comment
  )
  VALUES (
    p_club_id, p_member_id, p_staff_id,
    v_subtotal, v_discount, v_total,
    p_paid_with, NULLIF(trim(COALESCE(p_comment, '')), '')
  )
  RETURNING id INTO v_sale_id;

  -- 9. Insert each line, decrement stock
  FOR v_line IN SELECT * FROM jsonb_array_elements(p_lines) LOOP
    v_product_id := (v_line ->> 'product_id')::uuid;
    v_quantity := (v_line ->> 'quantity')::numeric;
    v_weight_source := COALESCE(v_line ->> 'weight_source', 'manual');
    v_scale_raw := v_line ->> 'scale_raw';

    -- Re-fetch (already locked above) for the unit_price snapshot.
    SELECT * INTO v_product FROM products WHERE id = v_product_id;
    v_line_total := ROUND(v_product.unit_price * v_quantity, 2);

    UPDATE products
      SET stock_on_hand = stock_on_hand - v_quantity
      WHERE id = v_product_id;

    INSERT INTO product_transactions (
      club_id, product_id, member_id, fulfilled_by,
      quantity, unit_price_at_sale, total_price,
      weight_source, scale_raw_reading, sale_id
    )
    VALUES (
      p_club_id, v_product_id, p_member_id, p_staff_id,
      v_quantity, v_product.unit_price, v_line_total,
      v_weight_source, v_scale_raw, v_sale_id
    );
  END LOOP;

  -- 10. Saldo deduction + ledger
  IF p_paid_with = 'saldo' THEN
    v_balance_after := v_member_balance - v_total;
    UPDATE members SET saldo_balance = v_balance_after WHERE id = p_member_id;

    INSERT INTO member_saldo_transactions (
      club_id, member_id, type, amount, balance_after,
      sale_id, method, comment, created_by
    )
    VALUES (
      p_club_id, p_member_id, 'sale', -v_total, v_balance_after,
      v_sale_id, NULL, NULLIF(trim(COALESCE(p_comment, '')), ''), p_staff_id
    );
  ELSE
    v_balance_after := NULL;
  END IF;

  -- 11. Activity log (single summary row per sale)
  INSERT INTO activity_log (club_id, staff_member_id, action, target_member_code, details)
  VALUES (
    p_club_id,
    p_staff_id,
    'product_sale',
    v_member_code,
    format(
      '%s line(s) · subtotal %s € · discount %s € · total %s € · %s',
      v_line_count::text,
      v_subtotal::text,
      v_discount::text,
      v_total::text,
      p_paid_with
    )
  );

  RETURN jsonb_build_object(
    'sale_id', v_sale_id,
    'total', v_total,
    'balance_after', v_balance_after
  );
END;
$$;
