-- Создание таблицы статей для библиотеки
CREATE TABLE IF NOT EXISTS t_p76837068_nikolife_health_app.articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('nutrition', 'training', 'health')),
    content TEXT NOT NULL,
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по категории
CREATE INDEX idx_articles_category ON t_p76837068_nikolife_health_app.articles(category);

-- Индекс для сортировки по дате публикации
CREATE INDEX idx_articles_published_date ON t_p76837068_nikolife_health_app.articles(published_date DESC);

-- Индекс для аналитики по просмотрам
CREATE INDEX idx_articles_view_count ON t_p76837068_nikolife_health_app.articles(view_count DESC);