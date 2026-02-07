ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_selected_plan ON users(selected_plan);
