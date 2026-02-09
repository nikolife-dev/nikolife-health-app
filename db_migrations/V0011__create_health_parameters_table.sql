-- Создаём таблицу для параметров здоровья пользователей
CREATE TABLE IF NOT EXISTS health_parameters (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    goal VARCHAR(50),
    activity_level VARCHAR(50),
    age INTEGER,
    weight NUMERIC(5,2),
    height INTEGER,
    diet_preference VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Индекс для быстрого поиска по user_id
CREATE INDEX IF NOT EXISTS idx_health_parameters_user_id ON health_parameters(user_id);

-- Миграция существующих данных из таблицы users
INSERT INTO health_parameters (user_id, goal, activity_level, age, weight, height, diet_preference, created_at)
SELECT id, goal, activity_level, age, weight, height, diet_preference, NOW()
FROM users
WHERE goal IS NOT NULL OR activity_level IS NOT NULL OR age IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;