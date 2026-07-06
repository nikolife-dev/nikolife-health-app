CREATE TABLE IF NOT EXISTS t_p76837068_nikolife_health_app.promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  discount_type VARCHAR(16) NOT NULL DEFAULT 'free_access',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  once_per_user BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p76837068_nikolife_health_app.promo_code_uses (
  id SERIAL PRIMARY KEY,
  promo_code_id INTEGER NOT NULL REFERENCES t_p76837068_nikolife_health_app.promo_codes(id),
  user_id INTEGER NOT NULL,
  plan_id VARCHAR(32),
  used_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_uses_code_user
  ON t_p76837068_nikolife_health_app.promo_code_uses (promo_code_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_promo_codes_code_lower
  ON t_p76837068_nikolife_health_app.promo_codes (LOWER(code));