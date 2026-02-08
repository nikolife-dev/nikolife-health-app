-- Удаляем ограничение уникальности, чтобы разрешить несколько рецептов на один прием пищи
ALTER TABLE weekly_menus DROP CONSTRAINT IF EXISTS weekly_menus_user_id_week_start_date_day_of_week_meal_type_key;

-- Добавляем поле для порядка рецептов в рамках одного приема пищи
ALTER TABLE weekly_menus ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 1;

-- Создаем новое уникальное ограничение, включающее position
ALTER TABLE weekly_menus ADD CONSTRAINT weekly_menus_unique_position 
  UNIQUE(user_id, week_start_date, day_of_week, meal_type, position);

-- Комментарий
COMMENT ON COLUMN weekly_menus.position IS 'Порядок рецепта в рамках приема пищи (1-5)';