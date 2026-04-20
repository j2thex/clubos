-- Panic / lockdown: staff or admin can flip a club into "locked" state,
-- which blocks member access via middleware. Staff and admin routes keep
-- working so whoever pressed the button can un-press it.

ALTER TABLE clubs ADD COLUMN locked_at timestamptz;
ALTER TABLE clubs ADD COLUMN locked_by uuid REFERENCES members(id) ON DELETE SET NULL;
ALTER TABLE clubs ADD COLUMN locked_reason text;
