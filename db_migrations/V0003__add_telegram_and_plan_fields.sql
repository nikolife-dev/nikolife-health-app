-- Добавляем поля для Telegram авторизации и тарифного плана
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(50);

-- Создаем индекс для быстрого поиска по telegram_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);

-- Комментарии к полям
COMMENT ON COLUMN users.telegram_id IS 'ID пользователя в Telegram';
COMMENT ON COLUMN users.telegram_username IS 'Username пользователя в Telegram';
COMMENT ON COLUMN users.selected_plan IS 'Выбранный тарифный план (basic, standard, premium)';