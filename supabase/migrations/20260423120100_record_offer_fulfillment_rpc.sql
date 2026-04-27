-- record_offer_fulfillment(p_offer_order_id, p_staff_id)
--
-- Atomic fulfillment for offers linked to a product:
--   1. Lock the pending offer_order row.
--   2. Resolve club_id + product_id + product_quantity from club_offers.
--   3. Call record_sale() with a single-line cart; currency_mode is read
--      from the club so the RPC passes the right p_paid_with.
--   4. Write sale_id + fulfilled_by + fulfilled_at on the offer_order.
--
-- All record_sale error codes (insufficient_stock, insufficient_saldo,
-- over_consumption_limit:..., product_inactive, ...) propagate unchanged.
--
-- Error codes specific to this RPC (all P0001):
--   offer_order_not_found, offer_order_not_pending, offer_not_linked_to_product

CREATE OR REPLACE FUNCTION record_offer_fulfillment(
  p_offer_order_id uuid,
  p_staff_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_club_id uuid;
  v_member_id uuid;
  v_product_id uuid;
  v_quantity numeric(10,3);
  v_currency_mode text;
  v_status text;
  v_lines jsonb;
  v_result jsonb;
BEGIN
  SELECT oo.status, co.club_id, oo.member_id, co.product_id, co.product_quantity
    INTO v_status, v_club_id, v_member_id, v_product_id, v_quantity
  FROM offer_orders oo
  JOIN club_offers co ON co.id = oo.club_offer_id
  WHERE oo.id = p_offer_order_id
  FOR UPDATE OF oo;

  IF v_club_id IS NULL THEN
    RAISE EXCEPTION 'offer_order_not_found' USING ERRCODE = 'P0001';
  END IF;
  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'offer_order_not_pending' USING ERRCODE = 'P0001';
  END IF;
  IF v_product_id IS NULL THEN
    RAISE EXCEPTION 'offer_not_linked_to_product' USING ERRCODE = 'P0001';
  END IF;

  SELECT currency_mode INTO v_currency_mode FROM clubs WHERE id = v_club_id;

  v_lines := jsonb_build_array(jsonb_build_object(
    'product_id', v_product_id,
    'quantity',   v_quantity,
    'weight_source', 'manual'
  ));

  v_result := record_sale(
    v_club_id,
    v_member_id,
    p_staff_id,
    v_lines,
    0,
    'offer',
    v_currency_mode
  );

  UPDATE offer_orders
  SET status = 'fulfilled',
      fulfilled_by = p_staff_id,
      fulfilled_at = now(),
      sale_id = (v_result ->> 'sale_id')::uuid
  WHERE id = p_offer_order_id;

  RETURN v_result;
END;
$$;
