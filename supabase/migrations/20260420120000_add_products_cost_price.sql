-- Adds cost_price to products so admins can track margin alongside unit_price.
-- Admin-only field: the staff sell flow and member-facing catalog never select it.

alter table public.products
  add column if not exists cost_price numeric(10,2) not null default 0;
