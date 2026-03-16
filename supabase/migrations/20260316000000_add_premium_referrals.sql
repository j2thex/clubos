-- Add premium referral fields to members table
ALTER TABLE members ADD COLUMN is_premium_referrer boolean NOT NULL DEFAULT false;
ALTER TABLE members ADD COLUMN referral_reward_spins integer NOT NULL DEFAULT 0;
