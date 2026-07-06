ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS provider VARCHAR(32) DEFAULT 'tribute',
  ADD COLUMN IF NOT EXISTS provider_order_id VARCHAR(128),
  ADD COLUMN IF NOT EXISTS payment_url TEXT,
  ADD COLUMN IF NOT EXISTS is_yearly BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_order_id ON subscriptions (provider_order_id);