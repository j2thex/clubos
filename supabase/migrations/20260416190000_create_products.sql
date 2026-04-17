-- Operations Module — product catalog & categories (dispensary menu).
-- Inventory tracked on the products row; sales decrement via a Phase 4 RPC.

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  name_es text,
  display_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_club
  ON product_categories(club_id, display_order);

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages product categories"
  ON product_categories FOR ALL
  USING (auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES product_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  name_es text,
  description text,
  description_es text,
  image_url text,
  unit text NOT NULL DEFAULT 'gram' CHECK (unit IN ('gram', 'piece')),
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  stock_on_hand numeric(10,3) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_club
  ON products(club_id, display_order);
CREATE INDEX IF NOT EXISTS idx_products_category
  ON products(category_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages products"
  ON products FOR ALL
  USING (auth.role() = 'service_role');
