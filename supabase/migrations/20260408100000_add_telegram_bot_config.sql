-- Telegram bot integration config (external bot on Railway)
ALTER TABLE clubs ADD COLUMN telegram_bot_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE clubs ADD COLUMN telegram_bot_referral_name text;
ALTER TABLE clubs ADD COLUMN telegram_bot_registration_price numeric(10,2);
ALTER TABLE clubs ADD COLUMN telegram_bot_welcome_message text;
