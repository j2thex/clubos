-- Add is_staff flag and make pin_hash nullable (members don't need PINs)
ALTER TABLE members ADD COLUMN is_staff boolean NOT NULL DEFAULT false;
ALTER TABLE members ALTER COLUMN pin_hash DROP NOT NULL;
