-- Link offers to products (ops module integration).
--
-- When ops is enabled, an admin can optionally bind an offer to one product
-- + a quantity. Fulfilling a linked offer routes through record_sale(), so
-- stock, saldo, and the monthly gram cap behave the same as a POS sale.
-- Offers with product_id IS NULL keep the legacy status-flip behavior.

ALTER TABLE club_offers
  ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_quantity numeric(10,3);

ALTER TABLE club_offers
  DROP CONSTRAINT IF EXISTS club_offers_product_quantity_ck;

ALTER TABLE club_offers
  ADD CONSTRAINT club_offers_product_quantity_ck
    CHECK (
      (product_id IS NULL AND product_quantity IS NULL)
      OR (product_id IS NOT NULL AND product_quantity IS NOT NULL AND product_quantity > 0)
    );

CREATE INDEX IF NOT EXISTS idx_club_offers_product ON club_offers(product_id);

-- Audit trail: which sale fulfilled this order (NULL for unlinked offers).
ALTER TABLE offer_orders
  ADD COLUMN IF NOT EXISTS sale_id uuid REFERENCES sales(id) ON DELETE SET NULL;
