-- Таблица рецептов
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ingredients JSONB NOT NULL,
    instructions TEXT NOT NULL,
    cooking_time INTEGER,
    servings INTEGER DEFAULT 1,
    calories INTEGER,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fats DECIMAL(5,2),
    image_url TEXT,
    category VARCHAR(100),
    tags JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id)
);

-- Таблица избранных рецептов пользователей
CREATE TABLE IF NOT EXISTS user_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    recipe_id INTEGER NOT NULL REFERENCES recipes(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, recipe_id)
);

-- Таблица меню на неделю
CREATE TABLE IF NOT EXISTS weekly_menus (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    week_start_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    meal_type VARCHAR(50) NOT NULL,
    recipe_id INTEGER NOT NULL REFERENCES recipes(id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, week_start_date, day_of_week, meal_type)
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_is_active ON recipes(is_active);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_recipe_id ON user_favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_weekly_menus_user_id ON weekly_menus(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_menus_week_start ON weekly_menus(week_start_date);

-- Добавляем поле is_admin в таблицу users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Комментарии
COMMENT ON TABLE recipes IS 'Рецепты блюд';
COMMENT ON TABLE user_favorites IS 'Избранные рецепты пользователей';
COMMENT ON TABLE weekly_menus IS 'Меню пользователей на неделю';
COMMENT ON COLUMN weekly_menus.day_of_week IS '1=Понедельник, 7=Воскресенье';
COMMENT ON COLUMN weekly_menus.meal_type IS 'breakfast, lunch, dinner, snack';