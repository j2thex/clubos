-- Convert all spin-related integer columns to numeric to support fractional values (e.g. 0.5 spins)
ALTER TABLE members ALTER COLUMN spin_balance TYPE numeric USING spin_balance::numeric;
ALTER TABLE members ALTER COLUMN referral_reward_spins TYPE numeric USING referral_reward_spins::numeric;
ALTER TABLE quests ALTER COLUMN reward_spins TYPE numeric USING reward_spins::numeric;
ALTER TABLE events ALTER COLUMN reward_spins TYPE numeric USING reward_spins::numeric;
ALTER TABLE clubs ALTER COLUMN spin_cost TYPE numeric USING spin_cost::numeric;
