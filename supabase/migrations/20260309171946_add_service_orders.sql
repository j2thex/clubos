-- Service orders (member requests for services, fulfilled by staff)
CREATE TABLE service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  fulfilled_by uuid REFERENCES members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  fulfilled_at timestamptz
);

CREATE INDEX idx_service_orders_service ON service_orders(service_id);
CREATE INDEX idx_service_orders_member ON service_orders(member_id);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
