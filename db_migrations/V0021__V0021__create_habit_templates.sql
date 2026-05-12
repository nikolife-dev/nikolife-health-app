CREATE TABLE IF NOT EXISTS habit_templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    color VARCHAR(20),
    frequency VARCHAR(50) DEFAULT 'daily',
    target_count INTEGER DEFAULT 1
);

INSERT INTO habit_templates (title, category, description, icon, color, frequency, target_count) VALUES
('Выпить 8 стаканов воды', 'health', 'Поддерживайте водный баланс в течение дня', '💧', '#3B82F6', 'daily', 8),
('Принять витамины', 'health', 'Ежедневный приём витаминов и добавок', '💊', '#10B981', 'daily', 1),
('Измерить вес', 'health', 'Контроль веса для достижения целей', '⚖️', '#F59E0B', 'daily', 1),
('Лечь спать до 23:00', 'health', 'Здоровый режим сна для восстановления', '😴', '#8B5CF6', 'daily', 1),
('Утренняя зарядка', 'fitness', '15 минут лёгкой зарядки после пробуждения', '🏃', '#EC4899', 'daily', 1),
('Пройти 10 000 шагов', 'fitness', 'Ежедневная ходьба для активности', '👟', '#F97316', 'daily', 10000),
('Тренировка', 'fitness', 'Силовая или кардио тренировка', '💪', '#EF4444', 'daily', 1),
('Растяжка', 'fitness', '10 минут растяжки для гибкости', '🧘', '#06B6D4', 'daily', 1),
('Медитация', 'mindfulness', '10 минут медитации для снижения стресса', '🧠', '#A78BFA', 'daily', 1),
('Дневник благодарности', 'mindfulness', 'Записать 3 вещи, за которые благодарен', '📔', '#FCD34D', 'daily', 1),
('Чтение книги', 'mindfulness', '30 минут чтения для развития', '📚', '#34D399', 'daily', 1),
('Без социальных сетей', 'mindfulness', 'Цифровой детокс — день без соцсетей', '📵', '#6B7280', 'daily', 1),
('Здоровый завтрак', 'nutrition', 'Начать день с питательного завтрака', '🥗', '#84CC16', 'daily', 1),
('Без сахара', 'nutrition', 'Отказ от сладкого и сахара', '🚫', '#F87171', 'daily', 1),
('Есть медленно', 'nutrition', 'Осознанное питание без спешки', '🍽️', '#FB923C', 'daily', 1);
