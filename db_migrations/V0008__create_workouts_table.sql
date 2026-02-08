-- Создание таблицы тренировок
CREATE TABLE IF NOT EXISTS t_p76837068_nikolife_health_app.workouts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('cardio', 'strength', 'flexibility')),
    published_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INTEGER NOT NULL,
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    calories INTEGER NOT NULL,
    video_url TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создание таблицы упражнений в тренировке
CREATE TABLE IF NOT EXISTS t_p76837068_nikolife_health_app.workout_exercises (
    id SERIAL PRIMARY KEY,
    workout_id INTEGER NOT NULL REFERENCES t_p76837068_nikolife_health_app.workouts(id),
    exercise_name VARCHAR(255) NOT NULL,
    sets VARCHAR(100) NOT NULL,
    rest_seconds INTEGER NOT NULL,
    exercise_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX idx_workouts_category ON t_p76837068_nikolife_health_app.workouts(category);
CREATE INDEX idx_workouts_difficulty ON t_p76837068_nikolife_health_app.workouts(difficulty);
CREATE INDEX idx_workouts_published_date ON t_p76837068_nikolife_health_app.workouts(published_date DESC);
CREATE INDEX idx_workouts_view_count ON t_p76837068_nikolife_health_app.workouts(view_count DESC);
CREATE INDEX idx_workout_exercises_workout_id ON t_p76837068_nikolife_health_app.workout_exercises(workout_id);