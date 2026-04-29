-- Telegram Member Subscriptions + Notification Broadcasts (multi-channel)
-- See plan: docs/superpowers/specs (telegram-member-subscriptions v1)

-- 1. Per-club bot config: username (for deep-link) + webhook secret + master toggle
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS telegram_bot_username text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS telegram_webhook_secret text;
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS telegram_member_subs_enabled boolean NOT NULL DEFAULT false;

-- 2. Member-side opt-in records
CREATE TABLE telegram_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES members(id) ON DELETE CASCADE NOT NULL,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  telegram_chat_id bigint NOT NULL,
  telegram_username text,
  locale text NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, telegram_chat_id),
  UNIQUE (member_id)
);

CREATE INDEX idx_telegram_subscriptions_member_id ON telegram_subscriptions(member_id);
CREATE INDEX idx_telegram_subscriptions_club_id ON telegram_subscriptions(club_id);

ALTER TABLE telegram_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages telegram subscriptions"
  ON telegram_subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- 3. Multi-channel broadcast audit (umbrella over future per-channel histories)
CREATE TABLE notification_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  sent_by uuid REFERENCES club_owners(id) ON DELETE SET NULL,
  channels text[] NOT NULL,
  segment jsonb,
  title text,
  body text NOT NULL,
  link_url text,
  recipient_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  failed_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_broadcasts_club_created
  ON notification_broadcasts(club_id, created_at DESC);

ALTER TABLE notification_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages notification broadcasts"
  ON notification_broadcasts FOR ALL
  USING (auth.role() = 'service_role');
