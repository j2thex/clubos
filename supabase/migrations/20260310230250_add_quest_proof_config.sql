-- Add proof configuration to quests (none/optional/required)
ALTER TABLE quests ADD COLUMN proof_mode text NOT NULL DEFAULT 'none';
ALTER TABLE quests ADD COLUMN proof_placeholder text;
