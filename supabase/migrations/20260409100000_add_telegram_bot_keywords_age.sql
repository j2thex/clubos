-- Add keywords and age restriction for Telegram bot spec
ALTER TABLE clubs ADD COLUMN telegram_bot_keywords text[] DEFAULT '{}';
ALTER TABLE clubs ADD COLUMN telegram_bot_age_restricted boolean NOT NULL DEFAULT true;
