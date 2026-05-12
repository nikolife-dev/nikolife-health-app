ALTER TABLE t_p76837068_nikolife_health_app.habits
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS goal_days integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS days_of_week text DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS times_per_day integer DEFAULT 1;