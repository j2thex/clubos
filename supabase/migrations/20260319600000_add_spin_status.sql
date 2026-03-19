-- Add status tracking for member self-service spins
-- 'fulfilled' = no action needed (staff spins, or "nothing" wins)
-- 'pending' = member won a prize, staff needs to fulfill
ALTER TABLE spins ADD COLUMN status text NOT NULL DEFAULT 'fulfilled';
ALTER TABLE spins ADD COLUMN fulfilled_by uuid REFERENCES members(id);
ALTER TABLE spins ADD COLUMN fulfilled_at timestamptz;
