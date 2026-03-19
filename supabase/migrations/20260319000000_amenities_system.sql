-- ============================================================
-- Amenities system — replaces services
-- ============================================================

-- 1. Master catalog of available amenities (platform-level)
CREATE TABLE amenity_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_es text,
  subtype text NOT NULL CHECK (subtype IN ('activity', 'experience', 'service', 'product')),
  icon text,
  is_approved boolean NOT NULL DEFAULT true,
  created_by_club_id uuid REFERENCES clubs(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_amenity_catalog_subtype ON amenity_catalog(subtype);

-- 2. Which amenities a club has enabled
CREATE TABLE club_amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES clubs(id),
  amenity_id uuid NOT NULL REFERENCES amenity_catalog(id),
  orderable boolean NOT NULL DEFAULT false,
  price numeric(10,2),
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(club_id, amenity_id)
);

CREATE INDEX idx_club_amenities_club ON club_amenities(club_id);

-- 3. Orders for orderable amenities
CREATE TABLE amenity_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_amenity_id uuid NOT NULL REFERENCES club_amenities(id),
  member_id uuid NOT NULL REFERENCES members(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled')),
  fulfilled_by uuid REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  fulfilled_at timestamptz
);

CREATE INDEX idx_amenity_orders_club_amenity ON amenity_orders(club_amenity_id);
CREATE INDEX idx_amenity_orders_member ON amenity_orders(member_id);

-- 4. Enable RLS
ALTER TABLE amenity_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenity_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies (service role bypasses, same as other tables)
CREATE POLICY "Service role full access" ON amenity_catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON club_amenities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON amenity_orders FOR ALL USING (true) WITH CHECK (true);

-- 5. Seed catalog with predefined amenities
-- Activities
INSERT INTO amenity_catalog (name, name_es, subtype, icon) VALUES
  ('Table Games', 'Juegos de Mesa', 'activity', 'dice-5'),
  ('Networking', 'Networking', 'activity', 'users'),
  ('Video Games', 'Videojuegos', 'activity', 'gamepad-2'),
  ('Sports on TV', 'Deportes en TV', 'activity', 'tv'),
  ('Bingo', 'Bingo', 'activity', 'hash'),
  ('Pool Table', 'Mesa de Billar', 'activity', 'circle-dot'),
  ('DJ', 'DJ', 'activity', 'music'),
  ('Live Music', 'Música en Vivo', 'activity', 'guitar'),
  ('Karaoke', 'Karaoke', 'activity', 'mic'),
  ('Trivia Night', 'Noche de Trivia', 'activity', 'brain'),
  ('Dance Floor', 'Pista de Baile', 'activity', 'party-popper'),
  ('Outdoor Terrace', 'Terraza Exterior', 'activity', 'sun');

-- Experiences
INSERT INTO amenity_catalog (name, name_es, subtype, icon) VALUES
  ('Hash', 'Hachís', 'experience', 'leaf'),
  ('Kief', 'Kief', 'experience', 'sparkles'),
  ('Education', 'Educación', 'experience', 'graduation-cap'),
  ('Events', 'Eventos', 'experience', 'calendar'),
  ('Gravity Hookah', 'Hookah de Gravedad', 'experience', 'flask-conical'),
  ('Volcano', 'Volcán', 'experience', 'mountain'),
  ('Vape', 'Vapeo', 'experience', 'wind'),
  ('Edibles', 'Comestibles', 'experience', 'cookie'),
  ('Vaporizer', 'Vaporizador', 'experience', 'cloud'),
  ('Extractions', 'Extracciones', 'experience', 'droplets'),
  ('Cali', 'Cali', 'experience', 'star'),
  ('Cocktails', 'Cócteles', 'experience', 'wine'),
  ('Craft Beer', 'Cerveza Artesanal', 'experience', 'beer'),
  ('Coffee', 'Café', 'experience', 'coffee'),
  ('Food Menu', 'Menú de Comida', 'experience', 'utensils');

-- Services
INSERT INTO amenity_catalog (name, name_es, subtype, icon) VALUES
  ('Bongs', 'Bongs', 'service', 'flask-round'),
  ('Pre-roll Maker', 'Liador de Porros', 'service', 'pencil'),
  ('Pipes', 'Pipas', 'service', 'pipette'),
  ('Movie Room', 'Sala de Cine', 'service', 'film'),
  ('VR Experience', 'Experiencia VR', 'service', 'glasses'),
  ('Degustation', 'Degustación', 'service', 'grape'),
  ('Competitions', 'Competiciones', 'service', 'trophy'),
  ('Birthday Service', 'Servicio de Cumpleaños', 'service', 'cake'),
  ('VIP Table', 'Mesa VIP', 'service', 'crown'),
  ('Bottle Service', 'Servicio de Botella', 'service', 'wine'),
  ('Private Room', 'Sala Privada', 'service', 'door-open'),
  ('Coat Check', 'Guardarropa', 'service', 'shirt'),
  ('WiFi', 'WiFi', 'service', 'wifi');

-- Products
INSERT INTO amenity_catalog (name, name_es, subtype, icon) VALUES
  ('Puffco', 'Puffco', 'product', 'zap'),
  ('RAW Papers', 'Papel RAW', 'product', 'scroll'),
  ('Club T-shirts', 'Camisetas del Club', 'product', 'shirt'),
  ('Lighters', 'Mecheros', 'product', 'flame'),
  ('Rolling Trays', 'Bandejas de Liar', 'product', 'layout-grid'),
  ('Stickers', 'Pegatinas', 'product', 'sticker'),
  ('Merchandise', 'Merchandising', 'product', 'shopping-bag'),
  ('Snacks', 'Snacks', 'product', 'candy'),
  ('Drinks', 'Bebidas', 'product', 'cup-soda');

-- 6. Drop old services system
DROP TABLE IF EXISTS service_orders;
DROP TABLE IF EXISTS services;
