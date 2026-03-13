-- Bug 5: quest type + referral tracking
ALTER TABLE quests ADD COLUMN quest_type text DEFAULT 'default';
ALTER TABLE member_quests ADD COLUMN referral_member_code text;

-- Bug 6: quest submission status (pending/verified)
ALTER TABLE member_quests ADD COLUMN status text DEFAULT 'verified';
