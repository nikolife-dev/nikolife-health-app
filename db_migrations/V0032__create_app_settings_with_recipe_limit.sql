CREATE TABLE IF NOT EXISTS t_p76837068_nikolife_health_app.app_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p76837068_nikolife_health_app.app_settings (key, value, description)
VALUES ('basic_plan_recipes_per_category', '3', 'Количество рецептов в каждой категории для тарифа "Базовый"')
ON CONFLICT (key) DO NOTHING;
