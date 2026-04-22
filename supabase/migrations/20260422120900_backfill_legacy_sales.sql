-- Backfill: wrap each pre-cart product_transactions row in a synthetic
-- 'sales' parent so the new transactions UI can use a single query path
-- (sales joined to its lines) without UNION-ing legacy rows.
--
-- Idempotent: only touches rows where sale_id IS NULL. Safe to re-run.
--
-- All synthetic parents are stamped:
--   paid_with = 'cash' (every pre-cart sale was a direct EUR sale)
--   subtotal  = total_price
--   discount  = 0
--   total     = total_price
--   comment   = NULL
--   voided_*  = mirrored from the line so voided legacy rows show as voided
--
-- Per-row loop (rather than set-based) guarantees 1:1 mapping even if two
-- legacy sales share a created_at microsecond.

DO $$
DECLARE
  v_pt product_transactions%ROWTYPE;
  v_sale_id uuid;
  v_count integer := 0;
BEGIN
  FOR v_pt IN
    SELECT * FROM product_transactions
    WHERE sale_id IS NULL
    ORDER BY created_at
  LOOP
    INSERT INTO sales (
      club_id, member_id, fulfilled_by,
      subtotal, discount, total,
      paid_with, comment,
      voided_at, voided_by, void_reason,
      created_at
    )
    VALUES (
      v_pt.club_id, v_pt.member_id, v_pt.fulfilled_by,
      v_pt.total_price, 0, v_pt.total_price,
      'cash', NULL,
      v_pt.voided_at, v_pt.voided_by, v_pt.void_reason,
      v_pt.created_at
    )
    RETURNING id INTO v_sale_id;

    UPDATE product_transactions
       SET sale_id = v_sale_id
     WHERE id = v_pt.id;

    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'backfill_legacy_sales: linked % legacy product_transactions row(s) to synthetic sales parents', v_count;
END;
$$;
