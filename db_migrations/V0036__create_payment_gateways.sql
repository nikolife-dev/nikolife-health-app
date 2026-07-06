CREATE TABLE IF NOT EXISTS payment_gateways (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(32) NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO payment_gateways (provider, is_enabled, settings) VALUES
  ('tribute', FALSE, '{}'::jsonb),
  ('tbank', FALSE, '{}'::jsonb),
  ('sberbank', FALSE, '{}'::jsonb),
  ('yoomoney', FALSE, '{}'::jsonb)
ON CONFLICT (provider) DO NOTHING;