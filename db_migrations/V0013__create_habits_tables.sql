CREATE TABLE IF NOT EXISTS t_p76837068_nikolife_health_app.habit_templates (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p76837068_nikolife_health_app.habits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  goal VARCHAR(100),
  goal_days INTEGER DEFAULT 30,
  days_of_week TEXT NOT NULL,
  times_per_day INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p76837068_nikolife_health_app.habit_completions (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON t_p76837068_nikolife_health_app.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON t_p76837068_nikolife_health_app.habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON t_p76837068_nikolife_health_app.habit_completions(completed_at);